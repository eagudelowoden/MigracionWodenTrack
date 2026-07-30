/**
 * REPORT-WORKER — proceso APARTE que calcula el reporte de asistencias
 * (descarga + cruce de mallas/turnos), para que ese trabajo pesado (CPU y
 * memoria) NUNCA bloquee el event loop de la API.
 *
 * A diferencia del worker de horas extra (que consume una cola persistida en
 * BD), este es TRANSITORIO: la API lo lanza (fork) por cada consulta de
 * reporte, le pasa los filtros por IPC, el worker calcula usando la MISMA
 * lógica de negocio (UsuariosService.getReporteNovedades) y reenvía progreso +
 * resultado por IPC. No toca la base de datos ni el disco — nada que
 * persistir, es una consulta de lectura efímera. Al terminar, se cierra solo.
 *
 * Protocolo IPC:
 *   worker  → padre:  { type: 'ready' }                          (listo para recibir filtros)
 *   padre   → worker: { tipo: 'params', ...filtros }
 *   worker  → padre:  { type: 'progress', percent, message }
 *   worker  → padre:  { type: 'stats', rssMb, heapUsedMb, cpuPercent } (cada 2s, para monitoreo)
 *   worker  → padre:  { type: 'chunk', data: [...] }              (varias veces)
 *   worker  → padre:  { type: 'done', total }
 *   worker  → padre:  { type: 'error', message }
 *
 * Se ejecuta con: node dist/report-worker.js  (lanzado vía fork() desde
 * ReporteWorkerService, no manualmente).
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsuariosService } from './usuarios/usuarios.service';

// Desactiva crons/seed duplicados en este proceso (misma bandera que worker.ts).
process.env.HX_WORKER = '1';

const CHUNK_SIZE = 1000;

/**
 * `process.send()` ENCOLA el mensaje en el pipe IPC, no lo escribe al instante.
 * Si `process.exit()` corre antes de que termine de escribirse, el mensaje se
 * PIERDE — el padre ve el proceso morir sin haber recibido 'done'/'error' y lo
 * trata como una caída inesperada (código 0), aunque el hijo terminó bien.
 * `send()` acepta un callback que confirma la escritura real: hay que esperarlo
 * SIEMPRE antes de cerrar el proceso.
 */
function sendAndFlush(msg: any): Promise<void> {
  return new Promise((resolve) => {
    if (!process.send) return resolve();
    process.send(msg, () => resolve());
  });
}

const STATS_INTERVAL_MS = 2000;

/**
 * Auto-reporte de consumo (RAM real del proceso + % CPU) para el panel de
 * monitoreo en Super Admin. `rss` es la memoria física real del proceso (más
 * representativa que el heap de V8 solo). El % de CPU se calcula con el delta
 * de `process.cpuUsage()` entre dos lecturas, sobre el tiempo real transcurrido.
 */
function iniciarReporteDeConsumo(): NodeJS.Timeout {
  let cpuAnterior = process.cpuUsage();
  let tiempoAnterior = Date.now();

  return setInterval(() => {
    const cpuDelta = process.cpuUsage(cpuAnterior); // microsegundos desde la última lectura
    const ahora = Date.now();
    const msTranscurridos = ahora - tiempoAnterior;

    const cpuPercent =
      msTranscurridos > 0
        ? Math.round(((cpuDelta.user + cpuDelta.system) / 1000 / msTranscurridos) * 100)
        : 0;

    cpuAnterior = process.cpuUsage();
    tiempoAnterior = ahora;

    const mem = process.memoryUsage();
    process.send?.({
      type: 'stats',
      rssMb: Math.round(mem.rss / 1024 / 1024),
      heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
      cpuPercent,
    });
  }, STATS_INTERVAL_MS);
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  const usuarios = app.get(UsuariosService);

  process.once('message', async (msg: any) => {
    if (!msg || msg.tipo !== 'params') return;

    const statsInterval = iniciarReporteDeConsumo();

    try {
      const result = await usuarios.getReporteNovedades(
        msg.hoy,
        msg.company,
        msg.startDate,
        msg.endDate,
        msg.departamento,
        msg.areaId,
        msg.segmentoId,
        msg.agrupar,
        (percent: number, message: string) => {
          // Progreso: no se espera (no es crítico si se pierde alguno), pero
          // no debe bloquear el bucle de descarga con awaits innecesarios.
          process.send?.({ type: 'progress', percent, message });
        },
      );

      for (let i = 0; i < result.length; i += CHUNK_SIZE) {
        await sendAndFlush({ type: 'chunk', data: result.slice(i, i + CHUNK_SIZE) });
      }
      // Mensaje FINAL: hay que garantizar que se escribió antes de cerrar.
      await sendAndFlush({ type: 'done', total: result.length });
    } catch (e: any) {
      await sendAndFlush({ type: 'error', message: e?.message || 'Error desconocido' });
    } finally {
      clearInterval(statsInterval);
      await app.close();
      process.exit(0);
    }
  });

  // Avisar al padre que ya está armado el listener antes de que mande los
  // filtros — evita la carrera de que los mande antes de que estemos listos.
  process.send?.({ type: 'ready' });
}

bootstrap().catch((e) => {
  // eslint-disable-next-line no-console
  console.error('Fallo fatal iniciando report-worker:', e);
  process.exit(1);
});
