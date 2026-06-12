import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
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
    @Query('soloNotificados') soloNotificados?: string,
    @Query('soloNoAprobados') soloNoAprobados?: string,
    @Query('area_id') area_id?: string,
    @Query('segmento_id') segmento_id?: string,
    @Query('calculado_por') calculado_por?: string,
    @Query('calculado_por_id') calculado_por_id?: string,
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
      soloNotificados: soloNotificados === 'true',
      soloNoAprobados: soloNoAprobados === 'true',
      area_id: area_id ? Number(area_id) : undefined,
      segmento_id: segmento_id ? Number(segmento_id) : undefined,
      calculado_por,
      calculado_por_id: calculado_por_id ? Number(calculado_por_id) : undefined,
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
    @Body() dto: { aprobado: boolean | null; observacion?: string },
  ) {
    return this.service.aprobarRegistro(
      Number(id),
      dto.aprobado,
      dto.observacion,
    );
  }

  @Patch(':id/actividad')
  actualizarActividad(
    @Param('id') id: string,
    @Body('actividad') actividad: string,
  ) {
    return this.service.actualizarActividad(Number(id), actividad ?? '');
  }

  @Patch(':id/horas')
  actualizarHoras(
    @Param('id') id: string,
    @Body()
    horas: {
      rn?: number;
      rndf?: number;
      rddf?: number;
      hedo?: number;
      heno?: number;
      hefd?: number;
      hefn?: number;
    },
  ) {
    return this.service.actualizarHoras(Number(id), horas);
  }

  @Get('novedades-aprobadas')
  novedadesAprobadas(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('company') company?: string,
    @Query('departamento') departamento?: string,
    @Query('area_id') area_id?: string,
    @Query('segmento_id') segmento_id?: string,
  ) {
    return this.service.getNovedadesAprobadas({
      startDate,
      endDate,
      company,
      departamento,
      area_id: area_id ? Number(area_id) : undefined,
      segmento_id: segmento_id ? Number(segmento_id) : undefined,
    });
  }

  @Post('notificar-aprobados')
  notificarAprobados(@Body() body: { registros: any[]; calculado_por?: string }) {
    return this.service.notificarAprobados(body.registros ?? [], body.calculado_por);
  }

  @Post('guardar-seleccionados')
  guardarSeleccionados(
    @Body() body: { registros: any[]; calculado_por?: string; calculado_por_id?: number },
  ) {
    return this.service.guardarSeleccionados(
      body.registros ?? [],
      body.calculado_por ?? 'Desconocido',
      body.calculado_por_id,
    );
  }

  @Post('exportar-calculado')
  async exportarCalculado(
    @Body() body: { registros: any[] },
    @Res() res: Response,
  ) {
    const buffer = await this.service.exportarCalculado(body.registros ?? []);
    const fecha = new Date().toISOString().slice(0, 10);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="reporte_hx_${fecha}.xlsx"`,
    );
    res.send(buffer);
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
    res!.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
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
      origen?: string;
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
      origen: body.origen ?? 'gerente',
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

  @Get('cargue/lotes')
  lotesCargue(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('company') company?: string,
    @Query('departamento') departamento?: string,
    @Query('area_id') area_id?: string,
    @Query('segmento_id') segmento_id?: string,
    @Query('soloNotificados') soloNotificados?: string,
    @Query('soloPendientes') soloPendientes?: string,
  ) {
    return this.service.getLotesCargue({
      startDate,
      endDate,
      company,
      departamento,
      area_id: area_id ? Number(area_id) : undefined,
      segmento_id: segmento_id ? Number(segmento_id) : undefined,
      soloNotificados: soloNotificados === 'true',
      soloPendientes: soloPendientes === 'true',
    });
  }

  @Get('cargue/registros/:loteId')
  registrosLote(@Param('loteId') loteId: string) {
    return this.service.getRegistrosLote(loteId);
  }

  @Get('cargue/comparar/:loteId')
  compararCargue(@Param('loteId') loteId: string) {
    return this.service.getComparativoCargue(loteId);
  }

  @Post('cargue/notificar/:loteId')
  notificarCargue(
    @Param('loteId') loteId: string,
    @Body() body: { cargado_por?: string },
  ) {
    return this.service.notificarDesdeCargue(loteId, body.cargado_por);
  }

  @Patch('cargue/aprobar/:id')
  aprobarCargue(
    @Param('id') id: string,
    @Body() dto: { aprobado: boolean | null },
  ) {
    return this.service.aprobarCargue(Number(id), dto.aprobado);
  }

  @Delete(':id')
  eliminarRegistro(@Param('id') id: string) {
    return this.service.eliminarRegistro(Number(id));
  }
}
