import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
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
  stats: { rssMb: number; heapUsedMb: number; cpuPercent: number } | null;
  child: ChildProcess;
}

interface PoolMember {
  child: ChildProcess;
  readyAt: number;
}

/**
 * Lanza el CRUCE del reporte de asistencias en un PROCESO APARTE (report-worker.ts)
 * en vez de calcularlo dentro de la API. Así el trabajo pesado (CPU + memoria)
 * nunca bloquea el event loop de la API ni congela las marcaciones de otros
 * usuarios mientras corre. No persiste nada en BD — es una consulta de lectura
 * efímera; el resultado se reenvía por IPC y se relaya al cliente por SSE.
 *
 * POOL PRECALENTADO: crear un worker desde cero implica bootstrapear todo el
 * contexto de Nest (conectar a SQL Server, wirear todos los módulos) ANTES de
 * poder tocar a Odoo — unos segundos de arranque en cada consulta. Para
 * evitarlo, se mantienen `POOL_SIZE` workers ya arrancados y en espera
 * ("precalentados"): al pedir un reporte, si hay uno libre se usa al instante
 * (sin esperar el bootstrap) y la pool se repone en segundo plano. Si la pool
 * está vacía (ej. ambos ocupados), se arranca uno nuevo bajo demanda — mismo
 * comportamiento que antes, sin romper nada.
 *
 * Además mantiene un registro EN MEMORIA de los workers activos Y del estado
 * de la pool para el panel de monitoreo en Super Admin.
 */
@Injectable()
export class ReporteWorkerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ReporteWorkerService.name);
  private readonly activos = new Map<number, WorkerInfo>();
  private readonly idlePool: PoolMember[] = [];
  private reponiendo = false;

  // Mismo número que el máximo de consultas pesadas simultáneas (CargaService).
  private readonly POOL_SIZE = 2;
  // Si un worker no termina en este tiempo, se considera colgado y se mata.
  private readonly TIMEOUT_MS = 3 * 60 * 1000;
  // Si un precalentado lleva ocioso más de esto, se recicla (evita conexiones
  // a SQL Server que el firewall/servidor pudo cerrar por inactividad).
  private readonly MAX_IDLE_MS = 10 * 60 * 1000;

  onApplicationBootstrap() {
    // El worker no debe precalentar workers propios (evita recursión/duplicación).
    if (process.env.HX_WORKER === '1') return;
    void this.reponerPool();
    setInterval(() => this.reciclarViejos(), 2 * 60 * 1000);
  }

  async ejecutar(
    params: ReporteWorkerParams,
    onProgress: (pct: number, msg: string) => void,
    onChunk: (data: any[]) => void,
  ): Promise<{ total: number }> {
    const child = await this.obtenerWorkerListo();
    child.send({ tipo: 'params', ...params });

    return new Promise((resolve, reject) => {
      const info: WorkerInfo = {
        pid: child.pid!,
        startedAt: Date.now(),
        filtros: params,
        ultimoProgreso: null,
        stats: null,
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
        // Este worker ya se consumió (o murió) → reponer la pool en segundo
        // plano para que el PRÓXIMO reporte también tenga uno precalentado.
        void this.reponerPool();
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

      child.on('message', (msg: any) => {
        if (!msg?.type) return;

        if (msg.type === 'progress') {
          info.ultimoProgreso = { percent: msg.percent, message: msg.message };
          onProgress(msg.percent, msg.message);
        } else if (msg.type === 'stats') {
          info.stats = { rssMb: msg.rssMb, heapUsedMb: msg.heapUsedMb, cpuPercent: msg.cpuPercent };
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
      // promesa para siempre. OJO: usamos 'close', NO 'exit' — 'exit' puede
      // dispararse ANTES de que el canal IPC termine de entregar los últimos
      // mensajes en tránsito (falso positivo de "murió sin avisar"); 'close'
      // Node lo garantiza recién DESPUÉS de que los streams (incluido IPC)
      // terminaron de drenar, así que si el mensaje 'done' ya se envió, aquí
      // siempre llega primero.
      child.on('close', (code) => {
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

  /**
   * Devuelve un worker LISTO para recibir params al instante: uno precalentado
   * de la pool si hay (arranque instantáneo), o uno nuevo bajo demanda si la
   * pool está vacía (mismo comportamiento de antes, sin romper nada).
   */
  private async obtenerWorkerListo(): Promise<ChildProcess> {
    const deLaPool = this.idlePool.shift();
    if (deLaPool) {
      this.logger.debug(`Worker precalentado (pid ${deLaPool.child.pid}) tomado de la pool.`);
      return deLaPool.child;
    }
    this.logger.debug('Pool de report-workers vacía — arrancando uno nuevo bajo demanda.');
    return this.forkYEsperarListo();
  }

  /** Arranca un report-worker y espera su mensaje 'ready' antes de devolverlo. */
  private forkYEsperarListo(): Promise<ChildProcess> {
    const workerPath = join(__dirname, '..', 'report-worker.js'); // dist/report-worker.js
    if (!existsSync(workerPath)) {
      return Promise.reject(
        new Error(
          `No se encontró el report-worker en ${workerPath}. ¿Compilaste el backend (npm run build)?`,
        ),
      );
    }

    return new Promise((resolve, reject) => {
      // Hereda --max-old-space-size del proceso padre (mismo heap generoso de
      // la API): el cruce pesado tiene el mismo colchón, sin arriesgar el heap
      // de la API porque corre en OTRO proceso.
      const child = fork(workerPath, [], {
        stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
      });

      const onMessage = (msg: any) => {
        if (msg?.type === 'ready') {
          child.off('message', onMessage);
          child.off('error', onError);
          resolve(child);
        }
      };
      const onError = (err: Error) => {
        child.off('message', onMessage);
        reject(err);
      };
      child.on('message', onMessage);
      child.once('error', onError);
    });
  }

  /** Repone la pool hasta POOL_SIZE workers precalentados. Idempotente. */
  private async reponerPool(): Promise<void> {
    if (this.reponiendo) return;
    this.reponiendo = true;
    try {
      while (this.idlePool.length < this.POOL_SIZE) {
        try {
          const child = await this.forkYEsperarListo();
          const miembro: PoolMember = { child, readyAt: Date.now() };
          this.idlePool.push(miembro);

          // Si muere estando OCIOSO en la pool (nunca llegó a recibir un job),
          // sacarlo y reponer. No afecta si ya salió de la pool para trabajar
          // (indexOf da -1 y este listener no hace nada).
          child.once('close', () => {
            const idx = this.idlePool.indexOf(miembro);
            if (idx !== -1) {
              this.idlePool.splice(idx, 1);
              this.logger.warn(
                `Worker precalentado (pid ${child.pid}) murió estando ocioso → se repone.`,
              );
              void this.reponerPool();
            }
          });
        } catch (e: any) {
          this.logger.error(`No se pudo precalentar un report-worker: ${e?.message}`);
          break; // evita bucle infinito si algo está mal (ej. falta el build)
        }
      }
    } finally {
      this.reponiendo = false;
    }
  }

  /**
   * Recicla precalentados que llevan demasiado tiempo ociosos: evita usar una
   * conexión a SQL Server que el firewall/servidor pudo cerrar por inactividad.
   */
  private reciclarViejos(): void {
    const ahora = Date.now();
    const viejos = this.idlePool.filter((m) => ahora - m.readyAt > this.MAX_IDLE_MS);
    for (const m of viejos) {
      const idx = this.idlePool.indexOf(m);
      if (idx !== -1) this.idlePool.splice(idx, 1);
      this.logger.debug(`Reciclando worker precalentado (pid ${m.child.pid}) por inactividad.`);
      m.child.kill('SIGTERM');
    }
    if (viejos.length) void this.reponerPool();
  }

  /** Para el panel de monitoreo en Super Admin. */
  listarActivos() {
    return [...this.activos.values()].map((w) => ({
      pid: w.pid,
      segundosActivo: Math.round((Date.now() - w.startedAt) / 1000),
      filtros: w.filtros,
      ultimoProgreso: w.ultimoProgreso,
      stats: w.stats,
    }));
  }

  /** Estado de la pool de precalentados, para el panel de monitoreo. */
  estadoPool() {
    return {
      tamanoObjetivo: this.POOL_SIZE,
      disponibles: this.idlePool.length,
      pids: this.idlePool.map((m) => m.child.pid),
    };
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
