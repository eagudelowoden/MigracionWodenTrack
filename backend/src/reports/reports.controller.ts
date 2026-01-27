import { Controller, Post, Body, Res, Get, Query } from '@nestjs/common'; // Agregamos Post y Body
import * as express from 'express';
import { ReportsService } from './reports.service';


@Controller('usuarios/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) { }

  // --- TU MÉTODO EXISTENTE (MALLAS) ---
  @Get('mallas/template')
  async descargarPlantilla(
    @Res() res: express.Response,
    @Query('company') companyName: string,
    @Query('departamento') departamento?: string // <--- CAPTURAMOS EL DEPARTAMENTO
  ) {
    try {
      // Pasamos ambos filtros al servicio
      const buffer = await this.reportsService.generarPlantillaMallas(companyName, departamento || '');

      // Limpiamos el nombre del archivo para que no tenga problemas con espacios
      const nombreArchivo = `plantilla_${companyName}_${departamento || 'general'}`.replace(/\s+/g, '_');

      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=${nombreArchivo}.xlsx`,
        'Content-Length': buffer.length,
      });

      return res.send(buffer);
    } catch (err) {
      console.error("Error al generar plantilla:", err.message);
      return res.status(500).json({ message: 'Error interno al generar el Excel' });
    }
  }

  // --- NUEVO MÉTODO (ASISTENCIAS) SIGUIENDO TU ESTILO ---
  @Post('asistencias/export')
  async exportarAsistencias(@Body() datosFiltrados: any[], @Res() res: express.Response) {
    try {
      // Llamamos al servicio pasando los datos que vienen del frontend
      const buffer = await this.reportsService.generarReporteAsistencias(datosFiltrados);

      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=reporte_asistencias.xlsx',
        'Content-Length': buffer.length,
      });

      return res.send(buffer);
    } catch (err) {
      console.error("Error en exportación asistencias:", err.message);
      // Usamos el 500 directo como en tu ejemplo
      return res.status(500).json({ message: err.message });
    }
  }
}