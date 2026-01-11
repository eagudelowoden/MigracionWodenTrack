import { Controller, Post, Body, Get } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post('login')
  async login(@Body() body: any) {
    // NestJS automáticamente convertirá los 'throw' del servicio en respuestas 401, 404, etc.
    return await this.usuariosService.login(body.usuario, body.password);
  }

  @Post('attendance')
  async attendance(@Body() body: { employee_id: number }) {
    return await this.usuariosService.attendance(body.employee_id);
  }

  @Get('mallas')
  async getMallas() {
    return await this.usuariosService.getAllMallas();
  }

  @Get('reporte-novedades')
  async getReporte() {
    return await this.usuariosService.getReporteNovedades();
  }
}
