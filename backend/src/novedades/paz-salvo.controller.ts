import {
  Controller, Get, Post, Patch,
  Param, Query, Body,
} from '@nestjs/common';
import { PazSalvoService } from './paz-salvo.service';

@Controller('usuarios/novedades/paz-salvo')
export class PazSalvoController {
  constructor(private readonly svc: PazSalvoService) {}

  /** Busca renuncias aprobadas por jefe */
  @Get('buscar')
  buscar(
    @Query('cedula')      cedula?: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin')    fechaFin?: string,
    @Query('company')     company?: string,
  ) {
    return this.svc.buscarRenuncias({ cedula, fechaInicio, fechaFin, company });
  }

  /** Lista los paz y salvo en proceso */
  @Get('en-proceso')
  enProceso() {
    return this.svc.listarEnProceso();
  }

  /** Obtiene o crea el registro paz_salvo para una novedad */
  @Post('iniciar/:novedadId')
  iniciar(
    @Param('novedadId') novedadId: string,
    @Body('por') por: string,
  ) {
    return this.svc.obtenerOCrear(Number(novedadId), por ?? 'Sistema');
  }

  /** Obtiene el estado actual de un paz_salvo */
  @Get(':id')
  obtener(@Param('id') id: string) {
    return this.svc.obtenerPorId(Number(id));
  }

  /** Actualiza un módulo del checklist (sst | ch | it) */
  @Patch(':id/modulo')
  actualizarModulo(
    @Param('id') id: string,
    @Body() body: { modulo: 'sst' | 'ch' | 'it'; ok: boolean; notas?: string; por?: string },
  ) {
    return this.svc.actualizarModulo(
      Number(id),
      body.modulo,
      body.ok,
      body.notas ?? '',
      body.por ?? 'Sistema',
    );
  }
}
