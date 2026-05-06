import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Query,
  Param,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { HorasExtraService } from './horas-extra.service';

@Controller('usuarios/horas-extra')
export class HorasExtraController {
  constructor(private readonly service: HorasExtraService) {}

  @Post('calcular')
  calcular(
    @Body()
    dto: {
      startDate?: string;
      endDate?: string;
      soloHoy?: boolean;
      company?: string;
      calculado_por?: string;
      area_id?: number;
      segmento_id?: number;
    },
  ) {
    return this.service.calcularExtras({ ...dto, guardar: false });
  }

  @Post('guardar')
  guardar(
    @Body()
    dto: {
      startDate?: string;
      endDate?: string;
      soloHoy?: boolean;
      company?: string;
      calculado_por?: string;
      area_id?: number;
      segmento_id?: number;
      registros?: { cedula: string; fecha: string; aprobado: boolean | null }[];
    },
  ) {
    return this.service.calcularExtras({ ...dto, guardar: true });
  }

  @Get('historial')
  historial(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('company') company?: string,
    @Query('cedula') cedula?: string,
    @Query('nombre') nombre?: string,
    @Query('cargo') cargo?: string,
    @Query('departamento') departamento?: string,
    @Query('soloConExtras') soloConExtras?: string,
    @Query('area_id') area_id?: string,
    @Query('segmento_id') segmento_id?: string,
  ) {
    return this.service.getHistorial({
      startDate,
      endDate,
      company,
      cedula,
      nombre,
      cargo,
      departamento,
      soloConExtras: soloConExtras === 'true',
      area_id: area_id ? Number(area_id) : undefined,
      segmento_id: segmento_id ? Number(segmento_id) : undefined,
    });
  }

  @Patch('aprobar')
  aprobar(
    @Body()
    dto: {
      startDate?: string;
      endDate?: string;
      company?: string;
      tipo: 'todas' | 'dominicales' | 'ninguna';
    },
  ) {
    return this.service.actualizarAprobacion(dto);
  }

  @Patch('aprobar/:id')
  aprobarRegistro(
    @Param('id') id: string,
    @Body() dto: { aprobado: boolean | null },
  ) {
    return this.service.aprobarRegistro(Number(id), dto.aprobado);
  }

  @Get('exportar-excel')
  async exportarExcel(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('company') company?: string,
    @Query('nombre') nombre?: string,
    @Query('cargo') cargo?: string,
    @Query('departamento') departamento?: string,
    @Query('area_id') area_id?: string,
    @Query('segmento_id') segmento_id?: string,
    @Res() res?: Response,
  ) {
    const buffer = await this.service.exportarExcel({
      startDate,
      endDate,
      company,
      nombre,
      cargo,
      departamento,
      area_id: area_id ? Number(area_id) : undefined,
      segmento_id: segmento_id ? Number(segmento_id) : undefined,
    });

    const fecha = new Date().toISOString().slice(0, 10);
    const filename = `reporte_hx_${fecha}.xlsx`;

    res!.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res!.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    res!.send(buffer);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // CARGUE MANUAL
  // ══════════════════════════════════════════════════════════════════════════════

  @Get('cargue/plantilla')
  async plantillaCargue(@Res() res: Response) {
    const buffer = await this.service.generarPlantillaCargue();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="plantilla_cargue_horas.xlsx"',
    );
    res.send(buffer);
  }

  @Post('cargue')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async subirCargue(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      company?: string;
      departamento?: string;
      area_id?: string;
      segmento_id?: string;
      cargado_por?: string;
    },
  ) {
    if (!file) {
      return { error: 'No se recibió ningún archivo' };
    }
    return this.service.procesarCargueExcel(file.buffer, {
      company: body.company,
      departamento: body.departamento,
      area_id: body.area_id ? Number(body.area_id) : undefined,
      segmento_id: body.segmento_id ? Number(body.segmento_id) : undefined,
      cargado_por: body.cargado_por,
    });
  }

  @Get('cargue/historial')
  historialCargue(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('company') company?: string,
    @Query('departamento') departamento?: string,
    @Query('area_id') area_id?: string,
    @Query('segmento_id') segmento_id?: string,
  ) {
    return this.service.getHistorialCargue({
      startDate,
      endDate,
      company,
      departamento,
      area_id: area_id ? Number(area_id) : undefined,
      segmento_id: segmento_id ? Number(segmento_id) : undefined,
    });
  }

  @Patch('cargue/aprobar/:id')
  aprobarCargue(
    @Param('id') id: string,
    @Body() dto: { aprobado: boolean | null },
  ) {
    return this.service.aprobarCargue(Number(id), dto.aprobado);
  }
}
