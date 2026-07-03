import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { MarcacionEcuadorService } from './marcacion-ecuador.service';

@Controller('usuarios/marcacion-ecuador')
export class MarcacionEcuadorController {
  constructor(private readonly service: MarcacionEcuadorService) {}

  /** Registra una marcación de entrada o salida con ubicación GPS */
  @Post('marcar')
  marcar(
    @Body()
    dto: {
      id_odoo: number;
      cedula: string;
      nombre: string;
      tipo: 'entrada' | 'salida';
      latitud?: number | null;
      longitud?: number | null;
      direccion?: string | null;
      company?: string;
    },
  ) {
    return this.service.marcar(dto);
  }

  /** Estado del día para un empleado: última marcación y tipo pendiente */
  @Get('estado/:id_odoo')
  estadoHoy(@Param('id_odoo') id_odoo: string) {
    return this.service.estadoHoy(Number(id_odoo));
  }

  /** Historial de marcaciones con filtros opcionales */
  @Get('historial')
  historial(
    @Query('id_odoo') id_odoo?: string,
    @Query('cedula') cedula?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('company') company?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.historial({
      id_odoo: id_odoo ? Number(id_odoo) : undefined,
      cedula,
      startDate,
      endDate,
      company,
      limit: limit ? Number(limit) : undefined,
    });
  }
}
