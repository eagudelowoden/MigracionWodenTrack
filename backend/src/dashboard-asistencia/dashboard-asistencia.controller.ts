import { Controller, Get, Query } from '@nestjs/common';
import { DashboardAsistenciaService } from './dashboard-asistencia.service';
import { Pesado } from '../common/carga/pesado.decorator';

@Controller('dashboard-asistencia')
export class DashboardAsistenciaController {
  constructor(private readonly service: DashboardAsistenciaService) {}

  @Pesado()
  @Get('ranking-tardanzas')
  rankingTardanzas(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('departamento') departamento?: string,
    @Query('company') company?: string,
  ) {
    return this.service.rankingTardanzas(startDate, endDate, departamento, company);
  }

  @Pesado()
  @Get('cumplimiento-por-area')
  cumplimientoPorArea(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('company') company?: string,
  ) {
    return this.service.cumplimientoPorArea(startDate, endDate, company);
  }

  @Pesado()
  @Get('tendencia-mensual')
  tendenciaMensual(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('departamento') departamento?: string,
    @Query('company') company?: string,
  ) {
    return this.service.tendenciaMensual(startDate, endDate, departamento, company);
  }

  @Get('departamentos')
  departamentos(@Query('company') company?: string) {
    return this.service.departamentos(company);
  }
}
