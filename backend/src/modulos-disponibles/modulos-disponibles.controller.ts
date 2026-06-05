import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put } from '@nestjs/common';
import { ModulosDisponiblesService } from './modulos-disponibles.service';

@Controller('modulos-disponibles')
export class ModulosDisponiblesController {
  constructor(private readonly svc: ModulosDisponiblesService) {}

  @Get()
  findAll() {
    return this.svc.findAll();
  }

  @Get('agrupados')
  findAgrupados() {
    return this.svc.findAgrupados();
  }

  @Get('grupos')
  getGrupos() {
    return this.svc.getGruposUnicos();
  }

  @Post()
  create(@Body() body: {
    slug: string;
    nombre: string;
    descripcion?: string;
    grupo: string;
    grupo_label: string;
    grupo_icon?: string;
    orden?: number;
    es_scope?: boolean;
    creado_por?: string;
  }) {
    return this.svc.create(body);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: {
      nombre?: string;
      descripcion?: string;
      grupo?: string;
      grupo_label?: string;
      grupo_icon?: string;
      orden?: number;
      activo?: boolean;
      es_scope?: boolean;
    },
  ) {
    return this.svc.update(id, body);
  }

  @Patch(':id/toggle')
  toggle(@Param('id', ParseIntPipe) id: number) {
    return this.svc.toggleActivo(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }
}
