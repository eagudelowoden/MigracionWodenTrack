/**
 * WORKER TRANSITORIO del resumen diario de asistencia — proceso APARTE de la
 * API (mismo patrón que report-worker.ts): arranca su propio contexto de Nest,
 * calcula el rango recibido por IPC con `AsistenciaResumenService` (que ya
 * hace los upserts en `asistencia_diaria_resumen`) y se cierra solo. Al ser
 * más liviano que horas extra (agregaciones simples, no un motor de cálculo
 * pesado) no necesita cola persistida en BD: se lanza bajo demanda, procesa el
 * rango que le manden y termina.
 *
 * Protocolo IPC:
 *   worker → padre:  { type: 'ready' }
 *   padre  → worker: { tipo: 'params', startDate, endDate, company }
 *   worker → padre:  { type: 'done', total }
 *   worker → padre:  { type: 'error', message }
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AsistenciaResumenService } from './dashboard-asistencia/asistencia-resumen.service';

process.env.HX_WORKER = '1'; // reusa la misma bandera: desactiva crons duplicados en este proceso

function sendAndFlush(msg: any): Promise<void> {
  return new Promise((resolve) => {
    if (!process.send) return resolve();
    process.send(msg, () => resolve());
  });
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const resumen = app.get(AsistenciaResumenService);

  process.once('message', async (msg: any) => {
    if (!msg || msg.tipo !== 'params') return;
    try {
      const total = await resumen.calcularYGuardarRango(msg.startDate, msg.endDate, msg.company);
      await sendAndFlush({ type: 'done', total });
    } catch (e: any) {
      await sendAndFlush({ type: 'error', message: e?.message || 'Error desconocido' });
    } finally {
      await app.close();
      process.exit(0);
    }
  });

  process.send?.({ type: 'ready' });
}

bootstrap().catch((e) => {
  // eslint-disable-next-line no-console
  console.error('Fallo fatal iniciando asistencia-resumen-worker:', e);
  process.exit(1);
});
