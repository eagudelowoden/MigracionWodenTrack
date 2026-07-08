/**
 * WORKER de horas extra — proceso APARTE de la API.
 *
 * Arranca un contexto de Nest (sin servidor HTTP) para reusar los servicios
 * existentes, y se queda en un bucle consumiendo la cola `horas_extra_jobs`:
 *   1. Toma 1 job pendiente (atómico).
 *   2. Lo calcula con el motor por lotes (`calcularExtras`, que ya guarda en DB).
 *   3. Lo marca completado / error.
 *   4. Si no hay nada, espera y vuelve a revisar.
 *
 * Al ser un proceso separado, si revienta la memoria muere SOLO el worker; la
 * API sigue viva. Se ejecuta con:  cross-env HX_WORKER=1 node dist/worker.js
 * (o `npm run start:worker`). En producción se deja vivo con PM2/NSSM.
 *
 * La bandera HX_WORKER=1 desactiva los crons de la app dentro de este proceso
 * para no duplicarlos (recordatorios, sync, seed).
 */
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { HorasExtraJobService } from './horas-extra/horas-extra-job.service';
import { HorasExtraService, CalcularExtrasDto } from './horas-extra/horas-extra.service';
import { HorasExtraCronService } from './horas-extra/horas-extra-cron.service';

const POLL_MS = 5000; // cada cuánto revisa la cola cuando está vacía (modo demonio)
// Modo "once": procesa la cola hasta vaciarla y se cierra. Lo usa el cron, que
// lanza el worker bajo demanda en vez de dejarlo prendido todo el día.
const ONCE = process.env.HX_WORKER_ONCE === '1';
const logger = new Logger('HXWorker');

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function bootstrap() {
  // Marca este proceso como worker (desactiva crons de la app)
  process.env.HX_WORKER = '1';

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  app.enableShutdownHooks();

  const jobs = app.get(HorasExtraJobService);
  const horas = app.get(HorasExtraService);
  const cron = app.get(HorasExtraCronService);

  // Devolver a la cola jobs que quedaron 'procesando' por una caída previa
  const recuperados = await jobs.recuperarColgados(30);
  if (recuperados > 0) {
    logger.warn(`Recuperados ${recuperados} job(s) colgados → vuelven a la cola.`);
  }

  logger.log(
    `Worker de horas extra iniciado (modo ${ONCE ? 'once: procesa y cierra' : 'demonio'}).`,
  );

  let activo = true;
  const detener = async (sig: string) => {
    logger.log(`Señal ${sig} recibida. Cerrando worker…`);
    activo = false;
    await app.close();
    process.exit(0);
  };
  process.on('SIGINT', () => detener('SIGINT'));
  process.on('SIGTERM', () => detener('SIGTERM'));

  // Bucle principal
  while (activo) {
    let job;
    try {
      job = await jobs.tomarSiguiente();
    } catch (e: any) {
      logger.error(`Error tomando job de la cola: ${e?.message}`);
      if (ONCE) break;
      await sleep(POLL_MS);
      continue;
    }

    if (!job) {
      if (ONCE) break; // modo once: cola vacía → terminar y cerrar
      await sleep(POLL_MS); // modo demonio: esperar y reintentar
      continue;
    }

    logger.log(`Procesando job #${job.id} (${job.tipo})…`);
    const t0 = Date.now();
    try {
      const params: CalcularExtrasDto = job.params
        ? JSON.parse(job.params)
        : {};
      // Calcula por lotes y guarda el snapshot en `calculados_extras`
      // (la tabla que consultan los usuarios). No toca `horas_extra`.
      const guardados = await horas.recalcularYGuardarCalculados(params);
      const seg = ((Date.now() - t0) / 1000).toFixed(1);
      await jobs.marcarCompletado(
        job.id,
        `${guardados} registros calculados en ${seg}s`,
      );
      // Solo tras un ÉXITO confirmado: si el job hubiera fallado, no se debe
      // avanzar el checkpoint delta (la próxima corrida debe reintentar desde
      // el mismo punto, no saltarse lo que este job no llegó a guardar).
      if (job.tipo === 'cron') {
        await cron.confirmarCorridaExitosa(params);
      }
      logger.log(`Job #${job.id} completado (${guardados} registros, ${seg}s).`);
    } catch (e: any) {
      logger.error(`Job #${job.id} falló: ${e?.message}`);
      await jobs.marcarError(job.id, e?.message ?? 'Error desconocido');
    }
  }

  // Modo once: salió del bucle porque la cola quedó vacía → cerrar y terminar.
  if (ONCE) {
    logger.log('Cola vacía. Worker (once) finalizado.');
    await app.close();
    process.exit(0);
  }
}

bootstrap().catch((e) => {
  // eslint-disable-next-line no-console
  console.error('Fallo fatal al iniciar el worker:', e);
  process.exit(1);
});
