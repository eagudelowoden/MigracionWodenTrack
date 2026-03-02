import {
  Controller,
  Get,
  Post,    // Añadido
  Patch,   // Añadido
  Param,   // Añadido
  Body     // Añadido
} from '@nestjs/common';
import { CompaniesService } from './companies.service';

@Controller('usuarios/companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) { }

  // Tabla Derecha: Datos de SQL Server (WodenTrack)
  @Get()
  async findAll() {
    return await this.companiesService.findAll();
  }

  // Tabla Izquierda: Datos crudos directamente de Odoo
  @Get('odoo-raw')
  async getRaw() {
    return await this.companiesService.getOdooRaw();
  }

  // Endpoint para ejecutar la sincronización manual
  @Post('sync')
  async sync() {
    return await this.companiesService.syncWithOdoo();
  }

  // Endpoint para habilitar/deshabilitar sedes desde el Admin
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string, // Los parámetros de URL llegan como string inicialmente
    @Body('is_active') is_active: boolean
  ) {
    return await this.companiesService.toggleStatus(Number(id), is_active);
  }
}