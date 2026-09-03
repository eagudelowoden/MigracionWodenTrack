import { Body, Controller, Get, Post, Put, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { DashboardAsistenciaService } from './dashboard-asistencia.service';
import { AsistenciaResumenCronService } from './asistencia-resumen-cron.service';
import { EventLoopMonitorService } from './event-loop-monitor.service';

@Controller('dashboard-asistencia')
export class DashboardAsistenciaController {
  constructor(
    private readonly service: DashboardAsistenciaService,
    private readonly resumenCron: AsistenciaResumenCronService,
    private readonly eventLoop: EventLoopMonitorService,
  ) {}

  /** Salud del hilo principal de la API — ver EventLoopMonitorService. */
  @Get('event-loop')
  eventLoopStatus() {
    return this.eventLoop.obtenerEstado() ?? { meanMs: 0, maxMs: 0, p99Ms: 0, ts: null };
  }

  @Get('resumen-cron/config')
  async obtenerConfigCron() {
    const config = await this.resumenCron.obtenerConfig();
    return {
      ...config,
      proximaEjecucion: this.resumenCron.proximaEjecucion(),
      procesando: this.resumenCron.estaProcesando(),
    };
  }

  @Put('resumen-cron/config')
  actualizarConfigCron(
    @Body()
    dto: {
      hora?: number;
      minuto?: number;
      activo?: boolean;
      dias_ventana?: number;
      company?: string;
      rango_fijo_desde?: string | null;
      rango_fijo_hasta?: string | null;
    },
  ) {
    return this.resumenCron.actualizarConfig(dto);
  }

  @Post('resumen-cron/ejecutar-ahora')
  ejecutarAhoraCron(@Body() dto: { startDate?: string; endDate?: string; company?: string }) {
    return this.resumenCron.ejecutarAhora(dto);
  }

  @Get('resumen-cron/estado')
  estadoCron() {
    return { procesando: this.resumenCron.estaProcesando() };
  }

  @Get('resumen-cron/logs')
  obtenerLogsCron(@Query('limit') limit?: string) {
    return this.resumenCron.obtenerLogs(limit ? Number(limit) : 20);
  }

  /**
   * Consola en vivo del cálculo: cada fase (autenticando/consultando Odoo,
   * guardando en BD) llega aquí apenas ocurre, vía SSE — para ver en tiempo
   * real dónde se va el tiempo de una corrida, no solo el resultado final.
   */
  @Get('resumen-cron/stream')
  streamProgresoCron(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

    // Ponerse al día con lo que ya pasó de la corrida actual (si hay una).
    for (const evento of this.resumenCron.obtenerProgresoReciente()) send(evento);

    const desuscribir = this.resumenCron.suscribirProgreso(send);
    res.on('close', desuscribir);
  }

  /** Cancela la corrida en curso (o libera el flag si el worker quedó colgado). */
  @Post('resumen-cron/cancelar')
  cancelarCron() {
    return this.resumenCron.cancelarActual();
  }

  @Get('ranking-tardanzas')
  rankingTardanzas(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('departamento') departamento?: string,
    @Query('company') company?: string,
    @Query('segmento') segmento?: string,
  ) {
    return this.service.rankingTardanzas(startDate, endDate, departamento, company, segmento);
  }

  @Get('cumplimiento-por-area')
  cumplimientoPorArea(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('company') company?: string,
    @Query('departamento') departamento?: string,
  ) {
    return this.service.cumplimientoPorArea(startDate, endDate, company, departamento);
  }

  @Get('tendencia-mensual')
  tendenciaMensual(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('departamento') departamento?: string,
    @Query('company') company?: string,
    @Query('segmento') segmento?: string,
  ) {
    return this.service.tendenciaMensual(startDate, endDate, departamento, company, segmento);
  }

  @Get('departamentos')
  departamentos(@Query('company') company?: string) {
    return this.service.departamentos(company);
  }

  @Get('detalle-dia')
  detalleDia(
    @Query('fecha') fecha: string,
    @Query('departamento') departamento?: string,
    @Query('company') company?: string,
    @Query('segmento') segmento?: string,
  ) {
    return this.service.detalleDia(fecha, departamento, company, segmento);
  }

  @Get('estado-asistencia')
  estadoAsistencia(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('departamento') departamento?: string,
    @Query('company') company?: string,
    @Query('segmento') segmento?: string,
  ) {
    return this.service.estadoAsistencia(startDate, endDate, departamento, company, segmento);
  }

  @Get('tardanzas-por-area')
  tardanzasPorArea(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('company') company?: string,
    @Query('departamento') departamento?: string,
    @Query('segmento') segmento?: string,
  ) {
    return this.service.tardanzasPorArea(startDate, endDate, company, departamento, segmento);
  }

  @Get('tardanzas-por-dia')
  tardanzasPorDia(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('departamento') departamento?: string,
    @Query('company') company?: string,
    @Query('segmento') segmento?: string,
  ) {
    return this.service.tardanzasPorDia(startDate, endDate, departamento, company, segmento);
  }

  @Get('ausencias-por-dia')
  ausenciasPorDia(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('departamento') departamento?: string,
    @Query('company') company?: string,
    @Query('segmento') segmento?: string,
  ) {
    return this.service.ausenciasPorDia(startDate, endDate, departamento, company, segmento);
  }

  @Get('distribucion-minutos-tardanza')
  distribucionMinutosTardanza(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('departamento') departamento?: string,
    @Query('company') company?: string,
    @Query('segmento') segmento?: string,
  ) {
    return this.service.distribucionMinutosTardanza(startDate, endDate, departamento, company, segmento);
  }

  @Get('calidad-marcaciones')
  calidadMarcaciones(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('departamento') departamento?: string,
    @Query('company') company?: string,
    @Query('segmento') segmento?: string,
  ) {
    return this.service.calidadMarcaciones(startDate, endDate, departamento, company, segmento);
  }
}
