import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AsistenciaResumenService } from '../dashboard-asistencia/asistencia-resumen.service';

process.env.HX_WORKER = '1';
const COMPANY = '(CO) WODEN OPERATIVA COLOMBIA S.A.S';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const resumen = app.get(AsistenciaResumenService);

  console.log('Recalculando 2026-08-01 → 2026-08-31 con el roster ya corregido...');
  const total = await resumen.calcularYGuardarRango('2026-08-01', '2026-08-31', COMPANY);
  console.log(`Listo: ${total} filas guardadas/actualizadas.`);

  await app.close();
  process.exit(0);
}

main().catch((e) => {
  console.error('FALLÓ:', e);
  process.exit(1);
});
