// src/novedades/novedades.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Res,
  UseInterceptors,
  UploadedFiles,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import express from 'express';
import { NovedadesService } from './novedades.service';
import { CreateNovedadDto } from './dto/create-novedad.dto';
import { UpdateAprobacionDto } from './dto/update-aprobacion.dto';

// DTO inline carpetas
class CreateEstadoChDto {
  nombre: string;
  icono?: string;
  color?: string;
  tipo?: string; // 'rrhh' | 'coordinador'
}

@Controller('usuarios/novedades')
export class NovedadesController {
  constructor(private readonly novedadesService: NovedadesService) {}

  // POST /novedades  — crea novedad + sube archivos (PDF / imagen, máx 10)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FilesInterceptor('archivos', 10))
  async create(
    @Body() dto: CreateNovedadDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.novedadesService.create(dto, files ?? []);
  }

  // GET /novedades  — lista todas
  @Get()
  findAll() {
    return this.novedadesService.findAll();
  }

  // ─── Rutas con prefijo literal — DEBEN ir ANTES de @Get(':id') ───────────

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

  // GET /novedades/por-area?idOdoo=X
  @Get('por-area')
  findPorArea(@Query('idOdoo') idOdoo: string) {
    return this.novedadesService.findPorAreaResponsable(+idOdoo);
  }

  // GET /novedades/por-segmento?idOdoo=X
  @Get('por-segmento')
  findPorSegmento(@Query('idOdoo') idOdoo: string) {
    return this.novedadesService.findPorSegmentoResponsable(+idOdoo);
  }

  // GET /novedades/por-mi-segmento?idOdoo=X
  // Para coordinadores con coord.ver_segmento: ve todo su segmento sin ser responsable
  @Get('por-mi-segmento')
  findPorMiSegmento(@Query('idOdoo') idOdoo: string) {
    return this.novedadesService.findPorMiSegmento(+idOdoo);
  }

  // GET /novedades/por-departamento?departamentos=A,B
  @Get('por-departamento')
  findPorDepartamento(@Query('departamentos') departamentos: string) {
    const list = departamentos
      ? departamentos.split(',').map((d) => d.trim()).filter(Boolean)
      : [];
    return this.novedadesService.findPorDepartamentos(list);
  }

  // ──────────────────────────────────────────────────────────────────
  // CARPETAS PERSONALIZADAS (independientes por módulo)
  // Estas rutas DEBEN estar antes de @Get(':id')
  // ──────────────────────────────────────────────────────────────────

  /**
   * GET /novedades/estados-ch?tipo=rrhh|coordinador
   * Devuelve las carpetas del módulo indicado
   */
  @Get('estados-ch')
  findEstadosCh(@Query('tipo') tipo: string) {
    return this.novedadesService.findEstadosCh(tipo || 'rrhh');
  }

  /**
   * POST /novedades/estados-ch
   * Crea una nueva carpeta — body: { nombre, icono?, color?, tipo }
   */
  @Post('estados-ch')
  @HttpCode(HttpStatus.CREATED)
  crearEstadoCh(@Body() dto: CreateEstadoChDto) {
    return this.novedadesService.crearEstadoCh(
      dto.nombre,
      dto.icono ?? 'fas fa-folder',
      dto.color ?? '#6b7280',
      dto.tipo ?? 'rrhh',
    );
  }

  /**
   * PUT /novedades/estados-ch/:id
   * Edita nombre/icono/color de una carpeta existente
   */
  @Put('estados-ch/:id')
  editarEstadoCh(@Param('id') id: string, @Body() dto: CreateEstadoChDto) {
    return this.novedadesService.editarEstadoCh(
      +id,
      dto.nombre,
      dto.icono ?? 'fas fa-folder',
      dto.color ?? '#6b7280',
    );
  }

  /**
   * DELETE /novedades/estados-ch/:id
   * Elimina la carpeta y limpia referencias en novedades
   */
  @Delete('estados-ch/:id')
  eliminarEstadoCh(@Param('id') id: string) {
    return this.novedadesService.eliminarEstadoCh(+id);
  }

  // ─── Rutas con parámetro :id — van DESPUÉS de todas las literales ─────────

  // GET /novedades/:id  — detalle + archivos
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.novedadesService.findOne(+id);
  }

  // GET /novedades/:id/file  — stream legacy soporte
  @Get(':id/file')
  async getFile(@Param('id') id: string, @Res() res: express.Response) {
    return this.novedadesService.streamFile(+id, res);
  }

  // ─── Archivos adjuntos (múltiples) ────────────────────────────────────────

  // GET  /novedades/:id/archivos          — lista archivos de la novedad
  @Get(':id/archivos')
  getArchivos(@Param('id') id: string) {
    return this.novedadesService.getArchivos(+id);
  }

  // POST /novedades/:id/archivos          — añadir archivos a novedad existente
  @Post(':id/archivos')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FilesInterceptor('archivos', 10))
  addArchivos(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.novedadesService.addArchivos(+id, files ?? []);
  }

  // GET  /novedades/:id/archivos/:archivoId/file — stream/redirect archivo
  @Get(':id/archivos/:archivoId/file')
  async getArchivoFile(
    @Param('id') id: string,
    @Param('archivoId') archivoId: string,
    @Res() res: express.Response,
  ) {
    return this.novedadesService.streamArchivo(+id, +archivoId, res);
  }

  // DELETE /novedades/:id/archivos/:archivoId — eliminar archivo
  @Delete(':id/archivos/:archivoId')
  removeArchivo(
    @Param('id') id: string,
    @Param('archivoId') archivoId: string,
  ) {
    return this.novedadesService.removeArchivo(+id, +archivoId);
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

  /**
   * POST /novedades/:id/estado-ch
   * Asigna una carpeta a una novedad
   * body: { estadoCh: string|null, tipo: 'rrhh'|'coordinador' }
   */
  @Post(':id/estado-ch')
  cambiarEstadoCh(
    @Param('id') id: string,
    @Body('estadoCh') estadoCh: string | null,
    @Body('tipo') tipo: string,
  ) {
    return this.novedadesService.cambiarEstadoCh(+id, estadoCh ?? null, tipo ?? 'rrhh');
  }
}
