import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Header,
} from '@nestjs/common';
import { SuperAdminFondosService } from './superadmin-fondos.service';

@Controller('usuarios/superadmin/fondos-empleados')
export class SuperAdminFondosController {
  constructor(private readonly svc: SuperAdminFondosService) {}

  /** GET /usuarios/superadmin/fondos-empleados */
  @Get()
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  findAll() {
    return this.svc.findAll();
  }

  /** POST /usuarios/superadmin/fondos-empleados */
  @Post()
  create(@Body() body: { nombre: string; createdBy?: string }) {
    return this.svc.create(body.nombre, body.createdBy || 'superadmin');
  }

  /** PATCH /usuarios/superadmin/fondos-empleados/:id */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { nombre?: string; correos?: string[]; updatedBy?: string },
  ) {
    return this.svc.update(id, body);
  }

  /** DELETE /usuarios/superadmin/fondos-empleados/:id */
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }
}
