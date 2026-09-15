import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { monitorEventLoopDelay, IntervalHistogram } from 'perf_hooks';

/**
 * Detecta bloqueos del event loop de la API (código síncrono largo, un
 * módulo npm mal portado, un `for` pesado que no debería estar aquí) usando
 * el histograma nativo de Node (`perf_hooks.monitorEventLoopDelay`) — no es
 * un profiler externo, así que su propio costo es despreciable.
 *
 * Reporta en NANOSEGUNDOS→ms el retraso del loop: en un proceso sano, el
 * "delay" ronda 0-5ms (el tiempo mínimo entre vueltas del loop). Si el
 * promedio o el máximo se disparan, algo está bloqueando el hilo principal
 * mientras corre — justo lo que NO debería pasar en la API (el trabajo
 * pesado ya vive en los workers aparte, ver `asistencia-resumen-worker.ts` /
 * `report-worker.ts`).
 */
@Injectable()
export class EventLoopMonitorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventLoopMonitorService.name);
  private histograma: IntervalHistogram | null = null;
  private intervalo: NodeJS.Timeout | null = null;
  private ultimaLectura: { meanMs: number; maxMs: number; p99Ms: number; ts: number } | null = null;

  // Umbral a partir del cual se loguea como advertencia (ms). Por debajo de
  // esto es ruido normal de un proceso Node con carga liviana.
  private static readonly UMBRAL_WARN_MS = 100;

  onModuleInit() {
    if (process.env.HX_WORKER === '1') return; // solo en la API, no en los workers aparte
    this.histograma = monitorEventLoopDelay({ resolution: 10 });
    this.histograma.enable();
    this.intervalo = setInterval(() => this.leer(), 10_000);
    this.intervalo.unref?.();
  }

  onModuleDestroy() {
    if (this.intervalo) clearInterval(this.intervalo);
    this.histograma?.disable();
  }

  private leer() {
    if (!this.histograma) return;
    const nsAMs = (ns: number) => Math.round((ns / 1e6) * 100) / 100;
    const lectura = {
      meanMs: nsAMs(this.histograma.mean),
      maxMs: nsAMs(this.histograma.max),
      p99Ms: nsAMs(this.histograma.percentile(99)),
      ts: Date.now(),
    };
    this.ultimaLectura = lectura;
    if (lectura.maxMs > EventLoopMonitorService.UMBRAL_WARN_MS) {
      this.logger.warn(
        `Event loop con retraso alto: max=${lectura.maxMs}ms mean=${lectura.meanMs}ms p99=${lectura.p99Ms}ms (últimos 10s) — algo bloqueó el hilo principal.`,
      );
    }
    this.histograma.reset();
  }

  /** Última lectura (se refresca cada 10s) para el panel de Super Admin. */
  obtenerEstado() {
    return this.ultimaLectura;
  }
}
