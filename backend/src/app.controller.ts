import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import * as fs from 'fs';

const MAINTENANCE_MARKER = 'name="Modo Mantenimiento" enabled=';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('version')
  getVersion() {
    const v = process.env.APP_VERSION || '1.0.0';
    return { version: v };
  }

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