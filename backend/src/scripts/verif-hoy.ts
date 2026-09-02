import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsuariosService } from '../usuarios/usuarios.service';

process.env.HX_WORKER = '1';
process.env.HX_NO_SPAWN = '1';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const usuarios = app.get(UsuariosService);
  const filas: any[] = await usuarios.getReporteNovedades(
    true,
    '(CO) WODEN OPERATIVA COLOMBIA S.A.S',
    undefined,
    undefined,
  );
  const deElla = filas.filter((f: any) => f.cc === '53046517');
  console.log('Filas de PINZON AVILA en modo HOY:', JSON.stringify(deElla, null, 2));
  await app.close();
  process.exit(0);
}
main().catch((e) => { console.error('Fallo:', e); process.exit(1); });
