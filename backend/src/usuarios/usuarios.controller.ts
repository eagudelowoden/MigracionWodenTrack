import { Controller, Post, Body, Get, HttpStatus, HttpException } from '@nestjs/common';
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

  // --- NUEVO: PUENTE PARA LA HORA OFICIAL ---
  @Get('hora-oficial')
  async getHoraOficial() {
    try {
      // Usamos fetch (disponible en Node.js 18+) o puedes usar axios si lo tienes instalado
      const response = await fetch('http://3.133.217.145:8081/time-colombia');
      if (!response.ok) throw new Error('Error en el servidor de tiempo');
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new HttpException(
        'No se pudo obtener la hora oficial del servidor externo',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
