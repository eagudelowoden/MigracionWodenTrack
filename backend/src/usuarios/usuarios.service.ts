import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { OdooService } from '../odoo/odoo.service';
import { getFechaColombia, decimalToMinutes } from '../common/utils/fecha.utils';

@Injectable()
export class UsuariosService {
  constructor(private readonly odoo: OdooService) {}

  // CONFIGURACIÓN: Cambiar a 'true' solo si los campos existen en el Odoo actual
  private readonly ENVIAR_CAMPOS_STUDIO = process.env.ENABLE_STUDIO_FIELDS === 'true';

  async login(usuario: string, password: string) {
    const { inicioDia, ahoraStr } = getFechaColombia();

    if (!usuario || !password) {
      throw new BadRequestException('Por favor, ingrese usuario y contraseña');
    }

    if (usuario !== password) {
      throw new UnauthorizedException('La contraseña no coincide con el usuario');
    }

    const uid = await this.odoo.authenticate();

    // 1. BUSCAR EMPLEADO
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

    // 2. LÓGICA DE ROLES
    //const palabrasAdmin = ['GERENTE', 'COORDINADOR', 'JEFE', 'DESARROLLADOR'];
    const palabrasAdmin = ['DESARROLLADOR'];
    const esSubalterno = ['AUXILIAR', 'PRACTICANTE', 'ANALISTA', 'APRENDIZ', 'ASISTENTE', 'INSPECTOR']
      .some((word) => cargo.includes(word));

    const esTI = cargo === 'TI' || cargo.includes(' TI ') || cargo.startsWith('TI ') || cargo.endsWith(' TI');
    const tieneMandoGeneral = palabrasAdmin.some((palabra) => cargo.includes(palabra));

    const esAdmin = (tieneMandoGeneral || esTI) && !esSubalterno;
    const rolAsignado = esAdmin ? 'admin' : 'user';

    // 3. VALIDACIÓN DE ESTADO (ASISTENCIA)
    // ¿Tiene algo abierto actualmente?
    const openAttendances = await this.odoo.executeKw<any[]>(
      'hr.attendance',
      'search_read',
      [[['employee_id', '=', emp.id], ['check_out', '=', false]]],
      { fields: ['check_in'], limit: 1 },
      uid,
    );

    const isInside = openAttendances.length > 0;
    let dayCompleted = false;

    // 4. LÓGICA DE CIERRE AUTOMÁTICO (Evitar bloqueo de día nuevo)
    const lastCompleted = await this.odoo.executeKw<any[]>(
      'hr.attendance',
      'search_read',
      [[['employee_id', '=', emp.id], ['check_out', '>=', inicioDia]]],
      { fields: ['check_in', 'check_out'], order: 'check_out desc', limit: 1 },
      uid,
    );

    if (lastCompleted.length > 0 && !isInside) {
      const registro = lastCompleted[0];
      const fechaEntrada = registro.check_in.split(' ')[0];
      const fechaSalida = registro.check_out.split(' ')[0];

      // Solo marcamos el día como completado si entró y salió el MISMO día
      if (fechaEntrada === fechaSalida) {
        dayCompleted = true;
      }
    }

    return {
      status: 'success',
      employee_id: emp.id,
      name: emp.name,
      job: cargoRaw,
      role: rolAsignado,
      is_inside: isInside,
      day_completed: dayCompleted,
    };
  }

  async attendance(employee_id: number) {
    const { inicioDia, ahoraStr } = getFechaColombia();
    const now = new Date();
    const dayOfWeekOdoo = (now.getDay() === 0 ? 6 : now.getDay() - 1).toString();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const uid = await this.odoo.authenticate();

    // 1. Buscar última asistencia abierta
    const lastAtt = await this.odoo.executeKw<any[]>(
      'hr.attendance',
      'search_read',
      [[['employee_id', '=', employee_id], ['check_out', '=', false]]],
      { fields: ['id', 'check_in'], limit: 1 },
      uid,
    );

    const activeSession = lastAtt && lastAtt.length > 0;

    // 2. Lógica de Horarios (Mallas)
    const contracts = await this.odoo.executeKw<any[]>(
      'hr.contract',
      'search_read',
      [[['employee_id', '=', employee_id], ['state', '=', 'open']]],
      { fields: ['resource_calendar_id'], limit: 1 },
      uid,
    );

    const calId = contracts?.length ? contracts[0].resource_calendar_id[0] : null;
    const mallas = calId ? await this.odoo.executeKw<any[]>(
      'resource.calendar.attendance',
      'search_read',
      [[['calendar_id', '=', calId], ['dayofweek', '=', dayOfWeekOdoo]]],
      { fields: ['hour_from', 'hour_to'] },
      uid,
    ) : [];

    let estado = 'A TIEMPO';
    if (mallas.length > 0) {
      const h = mallas.sort((a, b) => a.hour_from - b.hour_from)[0];
      if (!activeSession) {
        if (currentMinutes > decimalToMinutes(h.hour_from) + 5) estado = 'TARDE';
      } else {
        if (currentMinutes < decimalToMinutes(h.hour_to)) estado = 'SALIDA ANTICIPADA';
      }
    }

    // 3. Ejecución de Marcación
    if (activeSession) {
      const fechaEntrada = lastAtt[0].check_in.split(' ')[0];
      const fechaHoy = ahoraStr.split(' ')[0];

      // Si la entrada es de ayer, cerramos ayer y abrimos hoy
      if (fechaEntrada !== fechaHoy) {
        const cierreAyer = `${fechaEntrada} 23:59:59`;
        await this.odoo.executeKw('hr.attendance', 'write', [[lastAtt[0].id], { check_out: cierreAyer }], {}, uid);
        
        const createData: any = { employee_id, check_in: ahoraStr };
        if (this.ENVIAR_CAMPOS_STUDIO) createData.x_studio_comentario = estado;

        await this.odoo.executeKw('hr.attendance', 'create', [createData], {}, uid);
        return { status: 'success', type: 'in', message: 'NUEVA ENTRADA (CIERRE PREVIO AUTO)' };
      }

      // Salida normal del mismo día
      const updateData: any = { check_out: ahoraStr };
      if (this.ENVIAR_CAMPOS_STUDIO) updateData.x_studio_salida = estado;

      await this.odoo.executeKw('hr.attendance', 'write', [[lastAtt[0].id], updateData], {}, uid);
      return { status: 'success', type: 'out', message: estado };

    } else {
      // Entrada limpia
      const createData: any = { employee_id, check_in: ahoraStr };
      if (this.ENVIAR_CAMPOS_STUDIO) createData.x_studio_comentario = estado;

      await this.odoo.executeKw('hr.attendance', 'create', [createData], {}, uid);
      return { status: 'success', type: 'in', message: estado };
    }
  }

  // Agrega esto dentro de la clase UsuariosService
async getAllMallas() {
  const uid = await this.odoo.authenticate();
  const now = new Date();
  const dayOfWeekOdoo = (now.getDay() === 0 ? 6 : now.getDay() - 1).toString();

  // 1. OBTENER CONTRATOS EN LUGAR DE EMPLEADOS
  // Esto asegura que leas el 'resource_calendar_id' que acabas de actualizar
  const contracts = await this.odoo.executeKw<any[]>(
    'hr.contract',
    'search_read',
    [[['state', 'in', ['open', 'draft']], ['employee_id.active', '=', true]]],
    { 
      fields: ['employee_id', 'resource_calendar_id', 'job_id'], 
      order: 'employee_id asc' 
    },
    uid,
  );

  const calendarIds = [...new Set(contracts.map(c => c.resource_calendar_id?.[0]).filter(id => !!id))];

  // 2. Traer los horarios (igual que antes)
  const allMallas = await this.odoo.executeKw<any[]>(
    'resource.calendar.attendance',
    'search_read',
    [[['calendar_id', 'in', calendarIds], ['dayofweek', '=', dayOfWeekOdoo]]],
    { fields: ['calendar_id', 'hour_from', 'hour_to', 'day_period'] },
    uid,
  );

  // 3. Mapear desde contratos
  return contracts.map(con => {
    const mallaEmp = allMallas.find(m => m.calendar_id[0] === con.resource_calendar_id?.[0]);
    
    let horario = 'No programado';
    let jornada = 'N/A';

    if (mallaEmp) {
      horario = `${this.formatDecimal(mallaEmp.hour_from)} - ${this.formatDecimal(mallaEmp.hour_to)}`;
      const period = mallaEmp.day_period;
      jornada = period === 'morning' ? 'Diurna' : period === 'afternoon' ? 'Tarde' : 'Nocturna';
    }

    return {
      nombre: con.employee_id[1], // El nombre viene en el array del Many2one
      cc: 'Consultando...', // Si necesitas la CC, podrías agregar 'employee_id.identification_id' a los fields si tu Odoo lo permite
      malla: con.resource_calendar_id ? con.resource_calendar_id[1] : 'Sin Malla',
      jornada: jornada,
      horario: horario
    };
  });
}

// Función auxiliar para convertir 8.5 a "08:30"
private formatDecimal(decimal: number): string {
  const hrs = Math.floor(decimal);
  const mins = Math.round((decimal - hrs) * 60);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}


  
}