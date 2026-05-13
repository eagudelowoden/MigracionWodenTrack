import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { SuperAdminSolicitudesService } from './superadmin-solicitudes.service';

@Controller('usuarios/superadmin/solicitudes')
export class SuperAdminSolicitudesController {
  constructor(private readonly svc: SuperAdminSolicitudesService) {}

  @Get()
  getAll() {
    return this.svc.getAll();
  }

  @Get('pendientes/count')
  countPendientes() {
    return this.svc.countPendientes();
  }

  @Post()
  crear(@Body() body: {
    solicitante_id_odoo: number;
    solicitante_nombre: string;
    area_nombre?: string;
    segmento_nombre?: string;
    mensaje?: string;
  }) {
    return this.svc.crear(body);
  }

  @Patch(':id')
  atender(
    @Param('id') id: string,
    @Body() body: { estado: 'aprobado' | 'rechazado'; atendido_por: string },
  ) {
    return this.svc.atender(+id, body.estado, body.atendido_por);
  }
}
