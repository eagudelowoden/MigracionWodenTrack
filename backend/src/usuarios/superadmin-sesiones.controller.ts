import { Controller, Get, Post, Param, ParseIntPipe } from '@nestjs/common';
import { SuperAdminSesionesService } from './superadmin-sesiones.service';

@Controller('usuarios/superadmin/sesiones')
export class SuperAdminSesionesController {
  constructor(private readonly svc: SuperAdminSesionesService) {}

  @Get()
  getSesiones() {
    return this.svc.getSesionesActivas();
  }

  @Post('kick/:idOdoo')
  kick(@Param('idOdoo', ParseIntPipe) idOdoo: number) {
    return this.svc.kickSesion(idOdoo);
  }
}
