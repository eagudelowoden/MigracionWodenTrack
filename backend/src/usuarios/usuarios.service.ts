import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { OdooService } from '../odoo/odoo.service';
import { getFechaColombia, decimalToMinutes } from '../common/utils/fecha.utils';

@Injectable()
export class UsuariosService {
  constructor(private readonly odoo: OdooService) {}

  async login(usuario: string, password: string) {
    const { inicioDia } = getFechaColombia();

    // 1. VALIDACIÓN: Campos vacíos y simetría
    if (!usuario || !password) {
      throw new BadRequestException('Por favor, ingrese usuario y contraseña');
    }

    if (usuario !== password) {
      throw new UnauthorizedException('La contraseña no coincide con el usuario');
    }

    const uid = await this.odoo.authenticate();

    // 2. BUSCAR EMPLEADO
    const employees = await this.odoo.executeKw<any[]>(
      'hr.employee',
      'search_read',
      [[['pin', '=', usuario]]],
      { fields: ['id', 'name', 'job_id'], limit: 1 },
      uid,
    );

    if (!employees || employees.length === 0) {
      throw new NotFoundException('El usuario no existe en la base de datos');
    }

    const emp = employees[0];
    const cargoRaw = emp.job_id ? emp.job_id[1] : 'SIN CARGO';
    const cargo = cargoRaw.toUpperCase();

    // 3. LÓGICA DE ROLES (Tu lógica original de Node.js)
    const palabrasAdmin = ['GERENTE', 'COORDINADOR', 'JEFE', 'DESARROLLADOR'];
    const esSubalterno = ['AUXILIAR', 'PRACTICANTE', 'ANALISTA', 'APRENDIZ', 'ASISTENTE', 'INSPECTOR']
      .some((word) => cargo.includes(word));

    const esTI = cargo === 'TI' || cargo.includes(' TI ') || cargo.startsWith('TI ') || cargo.endsWith(' TI');
    const tieneMandoGeneral = palabrasAdmin.some((palabra) => cargo.includes(palabra));

    const esAdmin = (tieneMandoGeneral || esTI) && !esSubalterno;
    const rolAsignado = esAdmin ? 'admin' : 'user';

    // 4. VALIDACIÓN DE ESTADO (ASISTENCIA)
    // ¿Tiene algo abierto?
    const openCount = await this.odoo.executeKw<number>(
      'hr.attendance',
      'search_count',
      [[
        ['employee_id', '=', emp.id],
        ['check_out', '=', false],
      ]],
      {},
      uid,
    );

    // ¿Ya marcó salida hoy?
    const completedCount = await this.odoo.executeKw<number>(
      'hr.attendance',
      'search_count',
      [[
        ['employee_id', '=', emp.id],
        ['check_out', '>=', inicioDia],
      ]],
      {},
      uid,
    );

    const isInside = openCount > 0;

    return {
      status: 'success',
      employee_id: emp.id,
      name: emp.name,
      job: cargoRaw,
      role: rolAsignado,
      is_inside: isInside,
      day_completed: completedCount > 0 && !isInside,
    };
  }

  async attendance(employee_id: number) {
    const { inicioDia, ahoraStr } = getFechaColombia();
    const now = new Date();
    const dayOfWeekOdoo = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const uid = await this.odoo.authenticate();

    // 1. Buscar última asistencia abierta
    const lastAtt = await this.odoo.executeKw<any[]>(
      'hr.attendance',
      'search_read',
      [[
        ['employee_id', '=', employee_id],
        ['check_out', '=', false],
      ]],
      { fields: ['id'], limit: 1 },
      uid,
    );

    const isCheckOut = lastAtt && lastAtt.length > 0;

    // 2. Lógica de Mallas (Horarios)
    const contracts = await this.odoo.executeKw<any[]>(
      'hr.contract',
      'search_read',
      [[['employee_id', '=', employee_id], ['state', '=', 'open']]],
      { fields: ['resource_calendar_id'], limit: 1 },
      uid,
    );

    const calId = contracts?.length ? contracts[0].resource_calendar_id[0] : null;

    const mallas = await this.odoo.executeKw<any[]>(
      'resource.calendar.attendance',
      'search_read',
      [[
        ['calendar_id', '=', calId],
        ['dayofweek', '=', dayOfWeekOdoo.toString()],
      ]],
      { fields: ['hour_from', 'hour_to'] },
      uid,
    );

    let estado = 'A TIEMPO';
    if (mallas?.length) {
      const h = mallas.sort((a, b) => a.hour_from - b.hour_from)[0];
      if (!isCheckOut) {
        if (currentMinutes > decimalToMinutes(h.hour_from) + 5) estado = 'TARDE';
      } else {
        if (currentMinutes < decimalToMinutes(h.hour_to)) estado = 'SALIDA ANTICIPADA';
      }
    }

    // 3. Escribir en Odoo
    if (isCheckOut) {
      await this.odoo.executeKw(
        'hr.attendance',
        'write',
        [[lastAtt[0].id], { check_out: ahoraStr, x_studio_salida: estado }],
        {},
        uid,
      );
      return { status: 'success', type: 'out', message: estado };
    } else {
      await this.odoo.executeKw(
        'hr.attendance',
        'create',
        [{
          employee_id,
          check_in: ahoraStr,
          x_studio_comentario: estado,
        }],
        {},
        uid,
      );
      return { status: 'success', type: 'in', message: estado };
    }
  }
}