// Endpoints de gestión (solo SuperAdmin)
import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiExternaService } from './api-externa.service';

@Controller('usuarios/superadmin/api-externa')
export class SuperAdminApiController {
  constructor(private readonly svc: ApiExternaService) {}

  // ─── CAMPOS ───────────────────────────────────────────────────────────────
  @Get('campos')
  getCampos() {
    return this.svc.getCampos();
  }

  @Patch('campos')
  updateCampos(@Body() body: { campos: { campo: string; activo: boolean }[] }) {
    return this.svc.updateCampos(body.campos);
  }

  // ─── CREDENCIALES ─────────────────────────────────────────────────────────
  @Get('credenciales')
  getCredenciales() {
    return this.svc.getCredenciales();
  }

  @Post('credenciales')
  @HttpCode(HttpStatus.CREATED)
  createCredencial(
    @Body() body: { nombre: string; username: string; password: string },
  ) {
    return this.svc.createCredencial(body.nombre, body.username, body.password);
  }

  @Delete('credenciales/:id')
  deleteCredencial(@Param('id') id: string) {
    return this.svc.deleteCredencial(+id);
  }

  @Post('credenciales/:id/regenerar-token')
  regenerarToken(@Param('id') id: string) {
    return this.svc.regenerarToken(+id);
  }

  @Patch('credenciales/:id/toggle')
  toggleCredencial(
    @Param('id') id: string,
    @Body() body: { activa: boolean },
  ) {
    return this.svc.toggleCredencial(+id, body.activa);
  }
}
