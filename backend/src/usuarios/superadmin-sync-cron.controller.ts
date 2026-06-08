import { Body, Controller, Get, Post, Put, Query } from '@nestjs/common';
import { SuperAdminSyncCronService } from './superadmin-sync-cron.service';

@Controller('usuarios/sync-cron')
export class SuperAdminSyncCronController {
  constructor(private readonly svc: SuperAdminSyncCronService) {}

  /** GET /usuarios/sync-cron/config — config + estado actual */
  @Get('config')
  async getConfig() {
    const config = await this.svc.obtenerConfig();
    const proxima = this.svc.proximaEjecucion();
    return { ...config, proxima_ejecucion: proxima };
  }

  /** PUT /usuarios/sync-cron/config — actualizar hora, países, activo */
  @Put('config')
  async updateConfig(
    @Body() body: { hora?: number; minuto?: number; paises?: string; activo?: boolean },
  ) {
    return this.svc.actualizarConfig(body);
  }

  /** POST /usuarios/sync-cron/ejecutar — ejecutar manualmente ahora */
  @Post('ejecutar')
  async ejecutarAhora() {
    return this.svc.ejecutarSync('manual');
  }

  /** GET /usuarios/sync-cron/historial — últimas N ejecuciones */
  @Get('historial')
  async getHistorial(@Query('limit') limit?: string) {
    return this.svc.obtenerHistorial(limit ? parseInt(limit) : 20);
  }

  /** GET /usuarios/sync-cron/paises — lista de países disponibles en Odoo */
  @Get('paises')
  async getPaises() {
    return this.svc.obtenerPaisesOdoo();
  }
}
