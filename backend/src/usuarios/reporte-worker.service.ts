import { Injectable, Logger } from '@nestjs/common';
import { fork, ChildProcess } from 'child_process';
import { join } from 'path';
import { existsSync } from 'fs';

export interface ReporteWorkerParams {
  hoy: boolean;
  company?: string;
  startDate?: string;
  endDate?: string;
  departamento?: string;
  areaId?: number;
  segmentoId?: number;
  agrupar: boolean;
}

interface WorkerInfo {
  pid: number;
  startedAt: number;
  filtros: ReporteWorkerParams;
  ultimoProgreso: { percent: number; message: string } | null;
  child: ChildProcess;
}

/**
 * Lanza el CRUCE del reporte de asistencias en un PROCESO APARTE (report-worker.ts)
 * en vez de calcularlo dentro de la API. Así el trabajo pesado (CPU + memoria)
 * nunca bloquea el event loop de la API ni congela las marcaciones de otros
 * usuarios mientras corre. No persiste nada en BD — es una consulta de lectura
 * efímera; el resultado se reenvía por IPC y se relaya al cliente por SSE.
 *
 * Además mantiene un registro EN MEMORIA de los workers activos para el panel
 * de monitoreo en Super Admin (ver ReporteWorkerController).
 */
@Injectable()
export class ReporteWorkerService {
  private readonly logger = new Logger(ReporteWorkerService.name);
  private readonly activos = new Map<number, WorkerInfo>();

  // Si un worker no termina en este tiempo, se considera colgado y se mata.
  private readonly TIMEOUT_MS = 3 * 60 * 1000;

  async ejecutar(
    params: ReporteWorkerParams,
    onProgress: (pct: number, msg: string) => void,
    onChunk: (data: any[]) => void,
  ): Promise<{ total: number }> {
    // dist/usuarios/reporte-worker.service.js → dist/report-worker.js
    const workerPath = join(__dirname, '..', 'report-worker.js');
    if (!existsSync(workerPath)) {
      throw new Error(
        `No se encontró el report-worker en ${workerPath}. ¿Compilaste el backend (npm run build)?`,
      );
    }

    return new Promise((resolve, reject) => {
      // Hereda --max-old-space-size del proceso padre (mismo heap generoso de
      // la API): el cruce pesado tiene el mismo colchón, sin arriesgar el heap
      // de la API porque corre en OTRO proceso.
      const child = fork(workerPath, [], {
        stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
      });

      const info: WorkerInfo = {
        pid: child.pid!,
        startedAt: Date.now(),
        filtros: params,
        ultimoProgreso: null,
        child,
      };
      this.activos.set(child.pid!, info);

      // Logs del hijo → consola del padre (con prefijo, visibles en PM2 logs).
      child.stdout?.on('data', (d) =>
        this.logger.debug(`[report-worker ${child.pid}] ${d.toString().trim()}`),
      );
      child.stderr?.on('data', (d) =>
        this.logger.error(`[report-worker ${child.pid}] ${d.toString().trim()}`),
      );

      const limpiar = () => {
        clearTimeout(timer);
        this.activos.delete(child.pid!);
      };

      const timer = setTimeout(() => {
        this.logger.warn(
          `report-worker (pid ${child.pid}) excedió ${this.TIMEOUT_MS / 1000}s → se mata.`,
        );
        child.kill('SIGKILL');
        limpiar();
        reject(
          new Error(
            'La consulta tardó demasiado y fue cancelada. Reduce el rango o agrega filtros.',
          ),
        );
      }, this.TIMEOUT_MS);

      let listo = false;
      child.on('message', (msg: any) => {
        if (!msg?.type) return;

        if (msg.type === 'ready' && !listo) {
          listo = true;
          child.send({ tipo: 'params', ...params });
          return;
        }
        if (msg.type === 'progress') {
          info.ultimoProgreso = { percent: msg.percent, message: msg.message };
          onProgress(msg.percent, msg.message);
        } else if (msg.type === 'chunk') {
          onChunk(msg.data);
        } else if (msg.type === 'done') {
          limpiar();
          resolve({ total: msg.total });
        } else if (msg.type === 'error') {
          limpiar();
          reject(new Error(msg.message || 'Error en el worker de reporte'));
        }
      });

      // Si el proceso muere sin haber mandado 'done'/'error' (crash/OOM del
      // propio hijo), lo tratamos como error controlado en vez de colgar la
      // promesa para siempre.
      child.on('exit', (code) => {
        if (this.activos.has(child.pid!)) {
          limpiar();
          reject(
            new Error(
              `El proceso de reporte terminó inesperadamente (código ${code}). ` +
                `Reduce el rango o agrega filtros e intenta de nuevo.`,
            ),
          );
        }
      });

      child.on('error', (err) => {
        limpiar();
        reject(new Error(`No se pudo iniciar el worker de reporte: ${err.message}`));
      });
    });
  }

  /** Para el panel de monitoreo en Super Admin. */
  listarActivos() {
    return [...this.activos.values()].map((w) => ({
      pid: w.pid,
      segundosActivo: Math.round((Date.now() - w.startedAt) / 1000),
      filtros: w.filtros,
      ultimoProgreso: w.ultimoProgreso,
    }));
  }

  /** Botón "matar" del panel de monitoreo. */
  matar(pid: number): boolean {
    const info = this.activos.get(pid);
    if (!info) return false;
    info.child.kill('SIGKILL');
    this.activos.delete(pid);
    return true;
  }
}
