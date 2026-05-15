import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { SuperAdminAnaliticaService } from './superadmin-analitica.service';

@Controller('usuarios/superadmin/analitica')
export class SuperAdminAnaliticaController {
  constructor(private readonly svc: SuperAdminAnaliticaService) {}

  @Get('sin-malla')
  getEmpleadosSinMalla() {
    return this.svc.getEmpleadosSinMalla();
  }

  @Post('asignar-masivo')
  asignarMasivo(
    @Body()
    body: {
      asignaciones: { usuarioIdOdoo: number; mallaId: number }[];
      asignadoPor: string;
    },
  ) {
    return this.svc.asignarMallasMasivo(body.asignaciones, body.asignadoPor);
  }

  @Get('comparativa-areas')
  getComparativa(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.svc.getComparativaAreas(startDate, endDate);
  }

  @Get('heatmap')
  getHeatmap(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('departamento') departamento?: string,
  ) {
    return this.svc.getHeatmap(startDate, endDate, departamento || undefined);
  }
}
