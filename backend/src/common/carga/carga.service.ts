import { Injectable, Logger } from '@nestjs/common';
import * as v8 from 'v8';

/**
 * Control de admisión para consultas pesadas. En vez de dejar que la API muera
 * por OOM, vigila la presión de memoria y la concurrencia: cuando el sistema
 * está al límite, RECHAZA nuevas consultas pesadas (el llamador reintenta) pero
 * deja pasar las livianas (login, marcación, estado). Las consultas pesadas ya
 * en curso terminan normalmente.
 */
@Injectable()
export class CargaService {
  private readonly logger = new Logger(CargaService.name);

  private enCurso = 0;
  private readonly MAX_CONCURRENTES = 2;   // máx. consultas pesadas simultáneas
  private readonly UMBRAL_HEAP = 0.8;      // 80% del heap → no admitir más pesadas

  /** Límite real del heap del proceso (respeta --max-old-space-size). */
  private get heapLimit(): number {
    return v8.getHeapStatistics().heap_size_limit;
  }

  /** Fracción del heap usada ahora mismo (0..1). */
  private presionMemoria(): number {
    return process.memoryUsage().heapUsed / this.heapLimit;
  }

  /**
   * Intenta reservar un cupo para una consulta pesada.
   * @returns el motivo de rechazo, o `null` si se admitió (y reservó cupo).
   */
  intentarAdquirir(): 'memoria' | 'ocupado' | null {
    const presion = this.presionMemoria();
    if (presion >= this.UMBRAL_HEAP) {
      this.logger.warn(
        `Consulta pesada rechazada por MEMORIA: ${(presion * 100).toFixed(0)}% del heap en uso.`,
      );
      return 'memoria';
    }
    if (this.enCurso >= this.MAX_CONCURRENTES) {
      this.logger.warn(
        `Consulta pesada rechazada por CONCURRENCIA: ${this.enCurso} activas (máx ${this.MAX_CONCURRENTES}).`,
      );
      return 'ocupado';
    }
    this.enCurso++;
    return null;
  }

  /** Libera el cupo al terminar (o fallar) la consulta pesada. */
  liberar(): void {
    if (this.enCurso > 0) this.enCurso--;
  }

  /** Estado actual — útil para un endpoint de salud/diagnóstico. */
  estado() {
    return {
      enCurso: this.enCurso,
      maxConcurrentes: this.MAX_CONCURRENTES,
      presionMemoriaPct: Math.round(this.presionMemoria() * 100),
      umbralPct: this.UMBRAL_HEAP * 100,
    };
  }
}
