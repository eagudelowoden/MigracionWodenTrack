import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PazSalvoChecklist } from './entities/paz-salvo-checklist.entity';

@Controller('usuarios/novedades/paz-salvo-checklist')
export class PazSalvoChecklistController {
  constructor(
    @InjectRepository(PazSalvoChecklist)
    private readonly repo: Repository<PazSalvoChecklist>,
  ) {}

  /** Retorna todos los items activos agrupados por módulo (para el frontend de consultas) */
  @Get()
  async findAll(@Query('modulo') modulo?: string) {
    const where: any = { activo: true };
    if (modulo) where.modulo = modulo;
    return this.repo.find({ where, order: { modulo: 'ASC', orden: 'ASC' } });
  }

  /** Retorna TODOS (activos e inactivos) para el panel de administración */
  @Get('admin')
  async findAllAdmin() {
    return this.repo.find({ order: { modulo: 'ASC', orden: 'ASC' } });
  }

  @Post()
  async create(@Body() body: { modulo: string; texto: string; orden?: number; creado_por?: string }) {
    const item = this.repo.create({
      modulo: body.modulo,
      texto: body.texto,
      orden: body.orden ?? 0,
      activo: true,
      creado_por: body.creado_por ?? null,
    });
    return this.repo.save(item);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: { texto?: string; orden?: number; activo?: boolean },
  ) {
    await this.repo.update(Number(id), body);
    return this.repo.findOne({ where: { id: Number(id) } });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.repo.delete(Number(id));
    return { ok: true };
  }
}
