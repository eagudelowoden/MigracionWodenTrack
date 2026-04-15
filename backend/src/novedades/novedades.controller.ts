// src/novedades/novedades.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
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

  // DELETE /novedades/:id
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.novedadesService.remove(+id);
  }

  @Post(':id/aprobar-jefe')
  aprobarJefe(@Param('id') id: string, @Body() dto: UpdateAprobacionDto) {
    return this.novedadesService.aprobarJefe(+id, dto.aprobado, dto.motivo);
  }

  @Post(':id/aprobar-rrhh')
  aprobarRrhh(@Param('id') id: string, @Body() dto: UpdateAprobacionDto) {
    return this.novedadesService.aprobarRrhh(+id, dto.aprobado, dto.motivo);
  }
}
