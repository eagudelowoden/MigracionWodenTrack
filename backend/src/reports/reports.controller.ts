import { Controller, Get, Res } from '@nestjs/common';
// Cambia la importación de Response por esta:
import * as express from 'express'; 
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

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
}