import { Body, Controller, Get, Post, Put, Query } from '@nestjs/common';
import { OffboardingCronService } from './offboarding-cron.service';

@Controller('usuarios/offboarding/cron')
export class OffboardingCronController {
  constructor(private readonly svc: OffboardingCronService) {}

  /** GET /offboarding/cron/config */
  @Get('config')
  async getConfig() {
    const config = await this.svc.obtenerConfig();
    const proxima = this.svc.proximaEjecucion();
    return { ...config, proxima_ejecucion: proxima };
  }

  /** PUT /offboarding/cron/config */
  @Put('config')
  async updateConfig(
    @Body()
    body: {
      hora?: number;
      minuto?: number;
      horas_espera?: number;
      correos?: string;
      activo?: boolean;
    },
  ) {
    return this.svc.actualizarConfig(body);
  }

  /** POST /offboarding/cron/ejecutar — ejecutar manualmente
   *  Body opcional: { forzar: true } → ignora umbral de horas (útil para pruebas)
   */
  @Post('ejecutar')
  async ejecutar(@Body() body?: { forzar?: boolean }) {
    return this.svc.ejecutarRevision('manual', body?.forzar ?? false);
  }

  /** GET /offboarding/cron/historial */
  @Get('historial')
  async getHistorial(@Query('limit') limit?: string) {
    return this.svc.obtenerHistorial(limit ? parseInt(limit) : 20);
  }
}
