import { Controller, Post, Body, Res, Get } from '@nestjs/common'; // Agregamos Post y Body
import * as express from 'express';
import { ReportsService } from './reports.service';

@Controller('usuarios/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) { }

  // --- TU MÉTODO EXISTENTE (MALLAS) ---
  @Get('mallas/template')
  async descargarPlantilla(@Res() res: express.Response) {
    try {
      const buffer = await this.reportsService.generarPlantillaMallas();
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=plantilla_mallas.xlsx',
        'Content-Length': buffer.length,
      });
      return res.send(buffer);
    } catch (err) {
      console.error("Error en endpoint:", err.message);
      return res.status(500).json({ message: err.message });
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