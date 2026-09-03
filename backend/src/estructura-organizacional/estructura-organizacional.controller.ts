import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { EstructuraOrganizacionalService } from './estructura-organizacional.service';

@Controller('estructura-organizacional')
export class EstructuraOrganizacionalController {
  constructor(private readonly service: EstructuraOrganizacionalService) {}

  @Get('segmentos')
  listarSegmentos() {
    return this.service.listarSegmentos();
  }

  @Post('segmentos')
  crearSegmento(@Body() dto: { nombre: string; creadoPor?: string }) {
    return this.service.crearSegmento(dto);
  }

  @Delete('segmentos/:id')
  eliminarSegmento(@Param('id') id: string) {
    return this.service.eliminarSegmento(Number(id));
  }

  @Get('centros-costo')
  listarCentrosCosto() {
    return this.service.listarCentrosCosto();
  }

  @Post('centros-costo')
  crearCentroCosto(@Body() dto: { nombre: string; codigo?: string; creadoPor?: string }) {
    return this.service.crearCentroCosto(dto);
  }

  @Delete('centros-costo/:id')
  eliminarCentroCosto(@Param('id') id: string) {
    return this.service.eliminarCentroCosto(Number(id));
  }

  @Get('asignaciones')
  listarAsignaciones(
    @Query('search') search?: string,
    @Query('pais') pais?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.listarAsignaciones({
      search,
      pais,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Put('asignaciones/:idOdoo')
  asignar(
    @Param('idOdoo') idOdoo: string,
    @Body() dto: { segmento_id?: number | null; centro_costo_id?: number | null; adminName?: string },
  ) {
    return this.service.asignar(Number(idOdoo), dto);
  }
}
