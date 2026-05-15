import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { RecordatoriosService, RecordatorioDto } from './recordatorios.service';

@Controller('usuarios/recordatorios')
export class RecordatoriosController {
  constructor(private readonly svc: RecordatoriosService) {}

  @Get()
  findAll() { return this.svc.findAll(); }

  @Post()
  create(@Body() dto: RecordatorioDto) { return this.svc.create(dto); }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<RecordatorioDto>) {
    return this.svc.update(id, dto);
  }

  @Patch(':id/toggle')
  toggle(@Param('id', ParseIntPipe) id: number) { return this.svc.toggle(id); }

  @Post(':id/disparar')
  disparar(@Param('id', ParseIntPipe) id: number) { return this.svc.dispararManual(id); }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) { return this.svc.remove(id); }
}
