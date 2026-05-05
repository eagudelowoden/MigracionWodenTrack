// src/novedades/novedades.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Res,
  UseInterceptors,
  UploadedFile,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import express from 'express';
import { NovedadesService } from './novedades.service';
import { CreateNovedadDto } from './dto/create-novedad.dto';
import { UpdateAprobacionDto } from './dto/update-aprobacion.dto';

// DTO inline para crear estado CH
class CreateEstadoChDto {
  nombre: string;
  icono?: string;
  color?: string;
}

@Controller('usuarios/novedades')
export class NovedadesController {
  constructor(private readonly novedadesService: NovedadesService) {}

  // POST /novedades  — crea novedad + sube soporte
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('soporte'))
  async create(
    @Body() dto: CreateNovedadDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.novedadesService.create(dto, file);
  }

  // GET /novedades  — lista todas
  @Get()
  findAll() {
    return this.novedadesService.findAll();
  }

  // GET /novedades/mis-novedades?idOdoo=X&fechaDesde=...&fechaHasta=...&buscar=...
  @Get('mis-novedades')
  findMias(
    @Query('idOdoo') idOdoo: string,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
    @Query('buscar') buscar?: string,
  ) {
    return this.novedadesService.findMias(+idOdoo, fechaDesde, fechaHasta, buscar);
  }

  // GET /novedades/por-area?idOdoo=X  — solo empleados de las áreas que gestiona
  @Get('por-area')
  findPorArea(@Query('idOdoo') idOdoo: string) {
    return this.novedadesService.findPorAreaResponsable(+idOdoo);
  }

  // GET /novedades/por-segmento?idOdoo=X  — todos los empleados del segmento (con o sin área)
  @Get('por-segmento')
  findPorSegmento(@Query('idOdoo') idOdoo: string) {
    return this.novedadesService.findPorSegmentoResponsable(+idOdoo);
  }

  // GET /novedades/por-departamento?departamentos=A,B  — todos en los deptos del director
  @Get('por-departamento')
  findPorDepartamento(@Query('departamentos') departamentos: string) {
    const list = departamentos
      ? departamentos.split(',').map((d) => d.trim()).filter(Boolean)
      : [];
    return this.novedadesService.findPorDepartamentos(list);
  }

  // GET /novedades/:id  — detalle + fileUrl
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.novedadesService.findOne(+id);
  }

  // GET /novedades/:id/file  — stream local ó redirect S3
  @Get(':id/file')
  async getFile(@Param('id') id: string, @Res() res: express.Response) {
    return this.novedadesService.streamFile(+id, res);
  }

  // DELETE /novedades/:id?eliminadoPor=X&eliminadoPorNombre=Y
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Query('eliminadoPor') eliminadoPor?: string,
    @Query('eliminadoPorNombre') eliminadoPorNombre?: string,
  ) {
    return this.novedadesService.remove(
      +id,
      eliminadoPor ? +eliminadoPor : undefined,
      eliminadoPorNombre,
    );
  }

  @Post(':id/aprobar-jefe')
  aprobarJefe(@Param('id') id: string, @Body() dto: UpdateAprobacionDto) {
    return this.novedadesService.aprobarJefe(+id, dto.aprobado, dto.motivo);
  }

  @Post(':id/aprobar-rrhh')
  aprobarRrhh(@Param('id') id: string, @Body() dto: UpdateAprobacionDto) {
    return this.novedadesService.aprobarRrhh(+id, dto.aprobado, dto.motivo);
  }

  // ──────────────────────────────────────────────────────────────────
  // ESTADOS PERSONALIZADOS — CAPITAL HUMANO
  // ──────────────────────────────────────────────────────────────────

  /** GET /novedades/estados-ch  → lista todos los estados CH */
  @Get('estados-ch')
  findEstadosCh() {
    return this.novedadesService.findEstadosCh();
  }

  /** POST /novedades/estados-ch  → crea un nuevo estado CH */
  @Post('estados-ch')
  @HttpCode(HttpStatus.CREATED)
  crearEstadoCh(@Body() dto: CreateEstadoChDto) {
    return this.novedadesService.crearEstadoCh(
      dto.nombre,
      dto.icono ?? 'fas fa-folder',
      dto.color ?? '#6b7280',
    );
  }

  /** DELETE /novedades/estados-ch/:id  → elimina un estado CH */
  @Delete('estados-ch/:id')
  eliminarEstadoCh(@Param('id') id: string) {
    return this.novedadesService.eliminarEstadoCh(+id);
  }

  /** POST /novedades/:id/estado-ch  → asigna estado CH a una novedad */
  @Post(':id/estado-ch')
  cambiarEstadoCh(
    @Param('id') id: string,
    @Body('estadoCh') estadoCh: string | null,
  ) {
    return this.novedadesService.cambiarEstadoCh(+id, estadoCh ?? null);
  }
}
