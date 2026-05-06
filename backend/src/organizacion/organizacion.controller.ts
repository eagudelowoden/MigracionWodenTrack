import { Controller, Get, Post, Put, Body, Param, ParseIntPipe } from '@nestjs/common';
import { OrganizacionService } from './organizacion.service';

@Controller('usuarios/organizacion') // Lo dejamos vacío para que la ruta sea directamente http://localhost:8082/areas
export class OrganizacionController {
  constructor(private readonly organizacionService: OrganizacionService) {}

  // --- DEPARTAMENTOS (desde usuarios_registrados) ---

  @Get('departamentos')
  async getDepartamentos() {
    return await this.organizacionService.getDepartamentos();
  }

  // --- RUTAS PARA ÁREAS ---

  @Get('areas')
  async findAllAreas() {
    return await this.organizacionService.getAreas();
  }

  @Get('areas-agrupadas')
  async findAreasAgrupadas() {
    return await this.organizacionService.getAreasAgrupadas();
  }

  @Put('areas/:id')
  async updateArea(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { departamento?: string; responsableId?: number; nombre?: string },
  ) {
    return await this.organizacionService.updateArea(id, body);
  }

  @Post('areas')
  async createArea(
    @Body() createAreaDto: { nombre: string; responsableId: number; departamento?: string; creadoPor?: string },
  ) {
    return await this.organizacionService.createArea(createAreaDto);
  }

  // --- RUTAS PARA SEGMENTOS ---

  @Get('segmentos')
  async findAllSegmentos() {
    return await this.organizacionService.getSegmentos();
  }

  @Post('segmentos')
  async createSegmento(
    @Body() createSegmentoDto: { nombre: string; responsableId: number; creadoPor?: string },
  ) {
    return await this.organizacionService.createSegmento(createSegmentoDto);
  }
}
