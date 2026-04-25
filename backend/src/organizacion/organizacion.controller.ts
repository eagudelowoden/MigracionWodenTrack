import { Controller, Get, Post, Body } from '@nestjs/common';
import { OrganizacionService } from './organizacion.service';

@Controller('usuarios/organizacion') // Lo dejamos vacío para que la ruta sea directamente http://localhost:8082/areas
export class OrganizacionController {
  constructor(private readonly organizacionService: OrganizacionService) {}

  // --- RUTAS PARA ÁREAS ---

  @Get('areas')
  async findAllAreas() {
    return await this.organizacionService.getAreas();
  }

  @Post('areas')
  async createArea(
    @Body() createAreaDto: { nombre: string; responsableId: number; creadoPor?: string },
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
