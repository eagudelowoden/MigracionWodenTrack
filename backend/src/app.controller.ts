import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/public.decorator';
import * as fs from 'fs';

const MAINTENANCE_MARKER = 'name="Modo Mantenimiento" enabled=';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('version')
  getVersion() {
    const v = process.env.APP_VERSION || '1.0.0';
    return { version: v };
  }

  /**
   * Expone SOLO el nombre del entorno (.env activo) y el nombre de la base
   * de datos — nunca host, usuario, contraseña ni ninguna otra credencial.
   * Sirve para que el SuperAdmin confirme a simple vista si está parado en
   * desarrollo, QA o producción antes de ejecutar una acción sensible.
   */
  @Get('entorno')
  getEntorno() {
    return {
      entorno: process.env.NODE_ENV || 'development',
      database: process.env.DB_NAME || null,
    };
  }

  @Public()
  @Get('mantenimiento')
  getMantenimiento() {
    const configPath = process.env.WEBCONFIG_PATH;
    if (!configPath || !fs.existsSync(configPath)) {
      return { enabled: false, configured: false };
    }
    const content = fs.readFileSync(configPath, 'utf-8');
    const enabled = content.includes(`${MAINTENANCE_MARKER}"true"`);
    return { enabled, configured: true };
  }

  @Post('mantenimiento')
  setMantenimiento(@Body() body: { enabled: boolean }) {
    const configPath = process.env.WEBCONFIG_PATH;
    if (!configPath || !fs.existsSync(configPath)) {
      return { ok: false, message: 'WEBCONFIG_PATH no está configurado en .env o el archivo no existe' };
    }
    let content = fs.readFileSync(configPath, 'utf-8');
    if (body.enabled) {
      content = content.replace(`${MAINTENANCE_MARKER}"false"`, `${MAINTENANCE_MARKER}"true"`);
    } else {
      content = content.replace(`${MAINTENANCE_MARKER}"true"`, `${MAINTENANCE_MARKER}"false"`);
    }
    fs.writeFileSync(configPath, content, 'utf-8');
    return { ok: true, enabled: body.enabled };
  }
}