import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AsistenciaResumenService } from '../dashboard-asistencia/asistencia-resumen.service';

process.env.HX_WORKER = '1';
process.env.HX_NO_SPAWN = '1';

async function main() {
  const [, , startDate, endDate, company] = process.argv;
  if (!startDate || !endDate) {
    console.error('Uso: node dist/scripts/backfill-rango.js <startDate> <endDate> [company]');
    process.exit(1);
  }
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const resumen = app.get(AsistenciaResumenService);
  console.log(`Recalculando ${startDate} -> ${endDate} (company=${company ?? 'Todas'})...`);
  const total = await resumen.calcularYGuardarRango(startDate, endDate, company);
  console.log(`OK: ${total} filas guardadas.`);
  await app.close();
  process.exit(0);
}

main().catch((e) => {
  console.error('Fallo en backfill-rango:', e);
  process.exit(1);
});
