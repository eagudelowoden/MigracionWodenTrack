import {
  Controller,
  Post,
  Body,
  Get,
  HttpStatus,
  HttpException,
  Query,
  Param,
  BadRequestException,
  Patch,
} from '@nestjs/common';
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
  async getMallas(
    @Query('company') company?: string,
    @Query('departamento') departamento?: string, // <--- CAPTURAR EL DEPARTAMENTO
  ) {
    // Pasamos ambos parámetros al servicio en el orden correcto
    return await this.usuariosService.getAllMallas(company, departamento);
  }

  @Get('reporte-novedades')
  async getReporte(
    @Query('hoy') hoy?: string,
    @Query('company') company?: string,
    // @Query('departamento') departamento?: string,
    @Query('area_id') area_id?: string,
    @Query('segmento_id') segmento_id?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const soloHoy = hoy === 'true';

    return await this.usuariosService.getReporteNovedades(
      soloHoy,
      company,
      startDate,
      endDate,
      // departamento,
      // Cambiamos 'null' por 'undefined' para que TS no se queje
      area_id ? Number(area_id) : undefined,
      segmento_id ? Number(segmento_id) : undefined,
    );
  }

  /**
   * NUEVO: Consulta el estado actual del empleado antes de mostrar los botones.
   * Esto evitará que aparezca el botón "ENTRADA" si ya tiene una sesión abierta.
   */
  @Get('attendance-status/:employee_id')
  async getStatus(@Param('employee_id') employee_id: string) {
    try {
      // Necesitarás implementar este método en tu UsuariosService
      // para que busque en Odoo si hay un check_out == false
      return await this.usuariosService.getAttendanceStatus(
        Number(employee_id),
      );
    } catch (error) {
      throw new HttpException(
        'Error al obtener el estado de asistencia',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @Get('apk-info') // <--- Ruta final
  getApkInfo() {
    // Aquí va la lógica que escribiste antes
    return this.usuariosService.getApkInfo();
  }

  // --- NUEVO: PUENTE PARA LA HORA OFICIAL ---
  @Get('hora-oficial')
  async getHoraOficial() {
    try {
      // Intentamos obtener la hora externa con un límite de tiempo (Timeout)
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000); // 3 segundos máximo

      const response = await fetch('http://3.133.217.145:8081/time-colombia', {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) throw new Error();

      return await response.json();
    } catch (error) {
      // PLAN B: Si el externo falla, mandamos la hora del sistema
      // Esto evita que tu app de Ionic se bloquee con un error 500
      return {
        datetime: new Date().toISOString(),
        source: 'local_server_backup',
        message: 'Hora local (Servidor externo no disponible)',
      };
    }
  }

  @Get('sincronizar/lista-odoo')
  async listOdoo(@Query('pais') pais: string) {
    return await this.usuariosService.getOdooEmployeesRaw(pais);
  }

  @Get('sincronizar/lista-local')
  async listLocal() {
    return await this.usuariosService.findAllLocal();
  }

  @Post('sincronizar/ejecutar')
  async sync(
    @Query('pais') pais: string,
    @Query('depto') depto: string, // <--- Recibimos el depto
  ) {
    if (!pais) throw new BadRequestException('Debe seleccionar un país');
    return await this.usuariosService.syncUsuariosFromOdoo(pais, depto);
  }

  @Get('sincronizar/progreso')
  getSyncProgress() {
    return this.usuariosService.getProgress();
  }

  @Post('sincronizar/cancelar')
  cancelSync() {
    this.usuariosService.cancelSync();
    return { message: 'Señal de cancelación enviada' };
  }
  // usuarios.controller.ts
  @Post('sincronizar/preview')
  async syncPreview(
    @Query('pais') pais: string,
    @Query('depto') depto: string,
  ) {
    if (!pais) throw new BadRequestException('Debe seleccionar un país');
    return await this.usuariosService.previewSync(pais, depto);
  }

  @Post('asignar-permiso')
  async asignarPermiso(
    @Body()
    body: {
      idOdoo: number;
      modulo: string;
      activo: boolean;
      adminName: string;
    },
  ) {
    const { idOdoo, modulo, activo, adminName } = body;

    if (activo) {
      return await this.usuariosService.asignarModuloPermiso(
        idOdoo,
        modulo,
        'admin',
        adminName,
      );
    } else {
      // Método para eliminar el permiso si se desmarca el switch
      return await this.usuariosService.removerModuloPermiso(idOdoo, modulo);
    }
  }

  @Post('actualizar-estructura') // <--- Cambiado de Patch a Post
  async actualizarEstructura(
    @Body() body: { idOdoo: number; campo: string; valor: any },
  ) {
    const { idOdoo, campo, valor } = body;

    if (!['area_id', 'segmento_id'].includes(campo)) {
      throw new BadRequestException('Campo no permitido');
    }

    return await this.usuariosService.actualizarEstructuraLocal(
      idOdoo,
      campo,
      valor,
    );
  }
  @Get('perfil-completo/:idOdoo')
  async getPerfilCompleto(@Param('idOdoo') idOdoo: string) {
    return await this.usuariosService.obtenerPerfilConEstructura(
      Number(idOdoo),
    );
  }

  // Busca estas dos líneas en tu controller y agrégalas si no existen

  @Get('departamentos-permitidos/:idOdoo')
  async getDeptosPermitidos(@Param('idOdoo') idOdoo: number) {
    return this.usuariosService.getDeptosPermitidos(Number(idOdoo));
  }

  @Post('departamentos-permitidos/:idOdoo')
  async setDeptosPermitidos(
    @Param('idOdoo') idOdoo: number,
    @Body() body: { departamentos: string[] },
  ) {
    return this.usuariosService.setDeptosPermitidos(
      Number(idOdoo),
      body.departamentos,
    );
  }
}
