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

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  const usuarios = app.get(UsuariosService);

  process.once('message', async (msg: any) => {
    if (!msg || msg.tipo !== 'params') return;

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
          process.send?.({ type: 'progress', percent, message });
        },
      );

      for (let i = 0; i < result.length; i += CHUNK_SIZE) {
        process.send?.({ type: 'chunk', data: result.slice(i, i + CHUNK_SIZE) });
      }
      process.send?.({ type: 'done', total: result.length });
    } catch (e: any) {
      process.send?.({ type: 'error', message: e?.message || 'Error desconocido' });
    } finally {
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
