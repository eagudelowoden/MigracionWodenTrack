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
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { UsuariosService } from './usuarios.service';
import { Public } from '../auth/public.decorator';
import { Pesado } from '../common/carga/pesado.decorator';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Public()
  @Post('login')
  async login(@Body() body: any) {
    return await this.usuariosService.login(body.usuario, body.password);
  }

  @Post('cambiar-password')
  async cambiarPassword(
    @Body() body: { id_odoo: number; nueva_password: string; confirmar_password: string },
  ) {
    return await this.usuariosService.cambiarPassword(
      body.id_odoo,
      body.nueva_password,
      body.confirmar_password,
    );
  }

  @Post('attendance')
  async attendance(@Body() body: { employee_id: number; action?: 'in' | 'out' }) {
    return await this.usuariosService.attendance(body.employee_id, body.action);
  }

  @Get('mallas')
  async getMallas(
    @Query('company') company: string,
    @Query('departamento') departamento: string,
    @Query('area_id') areaId?: string,
    @Query('segmento_id') segmentoId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return await this.usuariosService.getAllMallas(
      company,
      departamento,
      areaId ? Number(areaId) : undefined,
      segmentoId ? +segmentoId : undefined,
      page ? Math.max(1, +page) : 1,
      limit ? Math.min(200, Math.max(1, +limit)) : 15,
      search?.trim() || undefined,
    );
  }

  @Get('mallas/departamentos')
  async getDepartamentosMalla(
    @Query('company') company: string,
    @Query('area_id') areaId?: string,
    @Query('segmento_id') segmentoId?: string,
  ) {
    return await this.usuariosService.getDepartamentosMalla(
      company,
      areaId ? Number(areaId) : undefined,
      segmentoId ? +segmentoId : undefined,
    );
  }

  @Get('reporte-novedades/stream')
  async getReporteNovedadesStream(
    @Query('hoy') hoy: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('company') company: string,
    @Query('departamento') departamento: string,
    @Query('area_id') areaId: string,
    @Query('segmento_id') segmentoId: string,
    @Query('agrupar') agrupar: string = 'true',
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const send = (data: object) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    if (hoy !== 'true' && startDate && endDate) {
      const inicio = new Date(startDate + 'T00:00:00');
      const fin = new Date(endDate + 'T00:00:00');
      const diffDias = (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDias < 0) {
        send({ type: 'error', message: 'La fecha de inicio debe ser anterior a la fecha de fin.' });
        res.end();
        return;
      }
      if (diffDias > 32) {
        send({
          type: 'error',
          message: `El rango máximo permitido es 32 días. Seleccionaste ${Math.round(diffDias)} días.`,
        });
        res.end();
        return;
      }
    }

    // Tamaño del lote enviado al cliente por evento SSE: evita serializar
    // (JSON.stringify) un array gigante de una sola vez y reduce el pico de
    // memoria retenido mientras se construye la respuesta.
    const CHUNK_SIZE = 1000;

    try {
      const result = await this.usuariosService.getReporteNovedades(
        hoy === 'true',
        company,
        startDate,
        endDate,
        departamento,
        areaId ? +areaId : undefined,
        segmentoId ? +segmentoId : undefined,
        agrupar !== 'false',
        (pct, msg) => send({ type: 'progress', percent: pct, message: msg }),
      );

      for (let i = 0; i < result.length; i += CHUNK_SIZE) {
        send({ type: 'chunk', data: result.slice(i, i + CHUNK_SIZE) });
      }
      send({ type: 'done', total: result.length });
    } catch (err: any) {
      send({ type: 'error', message: err?.message || 'Error desconocido' });
    } finally {
      res.end();
    }
  }

  // En el controlador
  @Pesado()
  @Get('reporte-novedades')
  async getReporteNovedades(
    @Query('hoy') hoy: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('company') company: string,
    @Query('departamento') departamento: string,
    @Query('area_id') areaId: string,
    @Query('segmento_id') segmentoId: string,
    @Query('agrupar') agrupar: string = 'true',
  ) {
    if (hoy !== 'true' && startDate && endDate) {
      const inicio = new Date(startDate + 'T00:00:00');
      const fin = new Date(endDate + 'T00:00:00');
      const diffDias = (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDias < 0)
        throw new BadRequestException('La fecha de inicio debe ser anterior a la fecha de fin.');
      if (diffDias > 32)
        throw new BadRequestException(
          `El rango máximo permitido es 32 días. Seleccionaste ${Math.round(diffDias)} días.`,
        );
    }

    return this.usuariosService.getReporteNovedades(
      hoy === 'true',
      company,
      startDate,
      endDate,
      departamento,
      areaId ? +areaId : undefined,
      segmentoId ? +segmentoId : undefined,
      agrupar !== 'false', // 👈 pasa true por defecto, false solo para Excel
    );
  }
  /**
   * NUEVO: Consulta el estado actual del empleado antes de mostrar los botones.
   * Esto evitará que aparezca el botón "ENTRADA" si ya tiene una sesión abierta.
   */
  @Get('malla-hoy/:employee_id')
  async getMallaHoy(@Param('employee_id') employee_id: string) {
    return await this.usuariosService.getMallaHoy(Number(employee_id));
  }

  @Post('reportar-falla')
  async reportarFalla(
    @Body() body: { empleado_id: number; nombre: string; descripcion: string },
  ) {
    return await this.usuariosService.reportarFalla(body);
  }

  @Get('reportes-falla')
  async getReportesFalla() {
    return await this.usuariosService.getReportesFalla();
  }

  @Patch('reportes-falla/:id/resolver')
  async resolverFalla(@Param('id') id: string) {
    return await this.usuariosService.resolverFalla(Number(id));
  }

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
  @Get('buscar-cedula/:cedula')
  async buscarPorCedula(@Param('cedula') cedula: string) {
    return this.usuariosService.buscarPorCedula(cedula);
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

  @Get('permisos/:id_odoo')
  async getPermisos(@Param('id_odoo') id_odoo: string) {
    return await this.usuariosService.obtenerPermisosUsuario(Number(id_odoo));
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
      return await this.usuariosService.removerModuloPermiso(
        idOdoo,
        modulo,
        adminName,
      );
    }
  }

  @Post('actualizar-estructura')
  async actualizarEstructura(
    @Body()
    body: {
      idOdoo: number;
      campo: string;
      valor: any;
      adminName?: string;
    },
  ) {
    const { idOdoo, campo, valor, adminName } = body;

    if (!['area_id', 'segmento_id'].includes(campo)) {
      throw new BadRequestException('Campo no permitido');
    }

    return await this.usuariosService.actualizarEstructuraLocal(
      idOdoo,
      campo,
      valor,
      adminName,
    );
  }
  @Get('perfil-completo/:idOdoo')
  async getPerfilCompleto(@Param('idOdoo') idOdoo: string) {
    return await this.usuariosService.obtenerPerfilConEstructura(
      Number(idOdoo),
    );
  }

  @Get('departamentos-permitidos/:idOdoo')
  async getDeptosPermitidos(@Param('idOdoo') idOdoo: number) {
    return this.usuariosService.getDeptosPermitidos(Number(idOdoo));
  }

  @Post('departamentos-permitidos/:idOdoo')
  async setDeptosPermitidos(
    @Param('idOdoo') idOdoo: number,
    @Body() body: { departamentos: string[]; adminName?: string },
  ) {
    return this.usuariosService.setDeptosPermitidos(
      Number(idOdoo),
      body.departamentos,
      body.adminName,
    );
  }

  @Get('area-responsable')
  async getResponsablePorArea(
    @Query('department') department: string,
    @Query('idOdoo') idOdoo: string,
  ) {
    return this.usuariosService.getResponsablePorArea(
      department,
      Number(idOdoo),
    );
  }
}
