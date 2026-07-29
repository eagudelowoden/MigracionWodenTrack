import { Injectable, Logger } from '@nestjs/common';
import * as v8 from 'v8';

interface EnEspera {
  resolver: () => void;      // concede el cupo al que esperaba
  timer: NodeJS.Timeout;     // timeout de espera máxima
}

/**
 * Control de admisión para consultas pesadas. Limita cuántas corren a la vez
 * (baja el pico de memoria) y, cuando no hay cupo, ENCOLA la petición hasta que
 * se libere uno — máximo 30 s. Así las pesadas se procesan de a poco en vez de
 * caerse. Solo se rechaza de inmediato si la memoria ya está peligrosa (encolar
 * no ayudaría) o si la espera supera el tope.
 *
 * Las consultas livianas no pasan por aquí (el interceptor solo aplica a los
 * endpoints marcados con @Pesado()).
 */
@Injectable()
export class CargaService {
  private readonly logger = new Logger(CargaService.name);

  private enCurso = 0;
  private readonly cola: EnEspera[] = [];

  private readonly MAX_CONCURRENTES = 2;    // máx. consultas pesadas simultáneas
  private readonly UMBRAL_HEAP = 0.8;       // 80% del heap → rechazo inmediato
  private readonly MAX_ESPERA_MS = 30_000;  // 30 s en cola antes de rendirse

  /** Límite real del heap del proceso (respeta --max-old-space-size). */
  private get heapLimit(): number {
    return v8.getHeapStatistics().heap_size_limit;
  }

  /** Fracción del heap usada ahora mismo (0..1). */
  private presionMemoria(): number {
    return process.memoryUsage().heapUsed / this.heapLimit;
  }

  /**
   * Solicita un cupo para una consulta pesada.
   *  - Memoria alta  → 'memoria' (rechazo inmediato, no encola).
   *  - Cupo libre    → null (admitida al instante).
   *  - Cupos llenos  → espera en cola hasta MAX_ESPERA_MS; si se libera → null,
   *                    si vence el tiempo → 'ocupado'.
   */
  async adquirir(): Promise<null | 'memoria' | 'ocupado'> {
    const presion = this.presionMemoria();
    if (presion >= this.UMBRAL_HEAP) {
      this.logger.warn(
        `Consulta pesada rechazada por MEMORIA: ${(presion * 100).toFixed(0)}% del heap en uso.`,
      );
      return 'memoria';
    }

    if (this.enCurso < this.MAX_CONCURRENTES) {
      this.enCurso++;
      return null;
    }

    // Sin cupo → esperar turno (la libera() nos entregará el cupo).
    return this.esperarCupo();
  }

  private esperarCupo(): Promise<null | 'ocupado'> {
    return new Promise((resolve) => {
      const entrada: EnEspera = {
        resolver: () => {
          clearTimeout(entrada.timer);
          // El cupo se hereda de quien liberó (enCurso NO se decrementó).
          resolve(null);
        },
        timer: setTimeout(() => {
          const idx = this.cola.indexOf(entrada);
          if (idx !== -1) this.cola.splice(idx, 1);
          this.logger.warn(
            `Consulta pesada esperó >${this.MAX_ESPERA_MS / 1000}s sin cupo → rechazada (cola: ${this.cola.length}).`,
          );
          resolve('ocupado');
        }, this.MAX_ESPERA_MS),
      };
      this.cola.push(entrada);
      this.logger.log(`Consulta pesada en cola (esperando: ${this.cola.length}).`);
    });
  }

  /**
   * Libera el cupo al terminar (o fallar) la consulta pesada. Si hay alguien
   * esperando, le entrega el cupo directamente (handoff) en vez de decrementar.
   */
  liberar(): void {
    const siguiente = this.cola.shift();
    if (siguiente) {
      siguiente.resolver(); // hereda el cupo; enCurso se mantiene
      return;
    }
    if (this.enCurso > 0) this.enCurso--;
  }

  /** Estado actual — útil para un endpoint de salud/diagnóstico. */
  estado() {
    return {
      enCurso: this.enCurso,
      esperando: this.cola.length,
      maxConcurrentes: this.MAX_CONCURRENTES,
      esperaMaxSeg: this.MAX_ESPERA_MS / 1000,
      presionMemoriaPct: Math.round(this.presionMemoria() * 100),
      umbralPct: this.UMBRAL_HEAP * 100,
    };
  }
}
