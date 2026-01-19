import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { OdooService } from '../odoo/odoo.service';
import { getFechaColombia, decimalToMinutes } from '../common/utils/fecha.utils';

@Injectable()
export class UsuariosService {
  constructor(private readonly odoo: OdooService) { }

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
    const esSuperAdmin = cargo.includes('DESARROLLADOR') || cargo.includes('GERENTE');
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
    let isInside = openAttendances.length > 0;
    let dayCompleted = false;

    // 4. LÓGICA DE CIERRE AUTOMÁTICO (Evitar bloqueo de día nuevo)
    const lastCompleted = await this.odoo.executeKw<any[]>(
      'hr.attendance',
      'search_read',
      [[['employee_id', '=', emp.id], ['check_out', '>=', inicioDia]]],
      { fields: ['check_in', 'check_out'], order: 'check_out desc', limit: 1 },
      uid,
    );
    // Si tiene una sesión abierta pero la entrada NO es de hoy, 
    // para el frontend es como si estuviera AFUERA para que pueda marcar entrada de nuevo.

    if (isInside) {
      const fechaEntrada = openAttendances[0].check_in.split(' ')[0];
      const { ahoraStr } = getFechaColombia();
      const fechaHoy = ahoraStr.split(' ')[0];
      const { cierreEstandar } = getFechaColombia();
      const cierreAyerUTC = `${fechaHoy} 04:59:59`;

      if (fechaEntrada !== fechaHoy) {
        // AQUÍ: Solo asignamos el valor, no usamos 'let'
        isInside = false;
      }
    }
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
      isSuperAdmin: esSuperAdmin, // Nueva bandera
      day_completed: dayCompleted,
    };
  }

  async attendance(employee_id: number) {
    // 1. OBTENER FECHAS Y CONEXIÓN
    const { ahoraStr } = getFechaColombia();
    const ahoraCol = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }));
    const hoyFechaCorta = ahoraCol.toISOString().split('T')[0];

    // Variables inicializadas para evitar errores de Scope (Cannot find name)
    let estadoCalculado = 'A TIEMPO';
    let infoMalla = 'SIN MALLA ASIGNADA';
    let autoCerrado = false;

    const uid = await this.odoo.authenticate();

    // 2. BUSCAR SESIÓN ACTIVA (Check-out vacío)
    const lastAtt = await this.odoo.executeKw<any[]>(
      'hr.attendance',
      'search_read',
      [[['employee_id', '=', employee_id], ['check_out', '=', false]]],
      { fields: ['id', 'check_in'], limit: 1 },
      uid,
    );

    let activeSession = lastAtt && lastAtt.length > 0;

    // 3. LÓGICA DE AUTO-CIERRE (Si hay sesión de días previos)
    if (activeSession) {
      const checkInStr = lastAtt[0].check_in; // Formato Odoo UTC
      const checkInFechaCorta = checkInStr.split(' ')[0];

      if (checkInFechaCorta !== hoyFechaCorta) {
        // --- SOLUCIÓN AL DESFASE USANDO TU LÓGICA DE UTILS ---
        // Tomamos la fecha de entrada, le sumamos 1 día y ponemos las 04:59:59 UTC
        // Esto resultará en 23:59:59 del día de entrada en el reporte de Colombia
        const fechaEntradaOdoo = new Date(checkInStr + 'Z');
        const diaCierre = new Date(fechaEntradaOdoo);
        diaCierre.setUTCDate(diaCierre.getUTCDate() + 1);

        const fechaDiaSiguiente = diaCierre.toISOString().split('T')[0];
        const cierreCompensadoParaOdoo = `${fechaDiaSiguiente} 04:59:59`;

        console.log(`[Auto-Cierre] Cerrando sesión olvidada del ${checkInFechaCorta}. Cierre UTC: ${cierreCompensadoParaOdoo}`);

        await this.odoo.executeKw('hr.attendance', 'write', [
          [lastAtt[0].id],
          {
            check_out: cierreCompensadoParaOdoo,
            x_studio_salida: 'OLVIDÓ MARCAR SALIDA (AUTO-CIERRE)'
          }
        ], {}, uid);

        // Forzamos activeSession a false para que proceda a crear la ENTRADA de hoy
        activeSession = false;
        autoCerrado = true;
      }
    }

    // 4. OBTENER CONTRATO Y MALLA PARA VALIDAR ESTADO
    const contracts = await this.odoo.executeKw<any[]>(
      'hr.contract',
      'search_read',
      [[['employee_id', '=', employee_id], ['state', 'in', ['open', 'draft']]]],
      { fields: ['resource_calendar_id'], limit: 1 },
      uid,
    );

    if (contracts && contracts.length > 0 && contracts[0].resource_calendar_id) {
      const calId = contracts[0].resource_calendar_id[0];
      const calNombre = contracts[0].resource_calendar_id[1];
      const dayOfWeekOdoo = (ahoraCol.getDay() === 0 ? 6 : ahoraCol.getDay() - 1).toString();
      const horaActualDecimal = ahoraCol.getHours() + ahoraCol.getMinutes() / 60;

      const mallas = await this.odoo.executeKw<any[]>(
        'resource.calendar.attendance',
        'search_read',
        [[['calendar_id', '=', calId], ['dayofweek', '=', dayOfWeekOdoo]]],
        { fields: ['hour_from', 'hour_to'] },
        uid,
      );

      if (mallas.length > 0) {
        const mallaTurno = mallas.sort((a, b) => a.hour_from - b.hour_from)[0];
        const tolerancia = 6 / 60; // 6 minutos

        if (!activeSession) {
          // Validación para Entrada Nueva
          if (horaActualDecimal > (mallaTurno.hour_from + tolerancia)) {
            estadoCalculado = 'ENTRADA TARDE';
          }
        } else {
          // Validación para Salida (Mismo día)
          if (horaActualDecimal < mallaTurno.hour_to) {
            estadoCalculado = 'SALIDA ANTICIPADA';
          }
        }
        infoMalla = `Malla: ${calNombre} (${this.formatDecimal(mallaTurno.hour_from)} - ${this.formatDecimal(mallaTurno.hour_to)})`;
      }
    }

    // 5. EJECUCIÓN FINAL EN ODOO
    if (activeSession) {
      // --- SALIDA NORMAL (Mismo día) ---
      await this.odoo.executeKw('hr.attendance', 'write', [
        [lastAtt[0].id],
        { check_out: ahoraStr, x_studio_salida: estadoCalculado }
      ], {}, uid);

      return {
        status: 'success',
        type: 'out',
        message: estadoCalculado,
        malla: infoMalla
      };

    } else {
      // --- ENTRADA (Nueva entrada O entrada después de auto-cerrar la vieja) ---
      await this.odoo.executeKw('hr.attendance', 'create', [
        {
          employee_id,
          check_in: ahoraStr,
          x_studio_comentario: estadoCalculado
        }
      ], {}, uid);

      return {
        status: 'success',
        type: 'in',
        message: autoCerrado ? `Se cerró registro anterior (23:59). ${estadoCalculado}` : estadoCalculado,
        malla: infoMalla
      };
    }
  }
  // Agrega esto dentro de la clase UsuariosService
  async getAllMallas(companyName?: string) {
    const uid = await this.odoo.authenticate();
    const now = new Date();
    const dayOfWeekOdoo = (now.getDay() === 0 ? 6 : now.getDay() - 1).toString();

    // 1. CONSTRUIR EL DOMINIO CORRECTAMENTE
    // Iniciamos con los filtros fijos
    const domain: any[] = [
      ['state', 'in', ['open', 'draft']],
      ['employee_id.active', '=', true]
    ];

    // Agregamos la compañía solo si viene el parámetro
    if (companyName && companyName.trim() !== "") {
      domain.push(['employee_id.company_id.name', '=', companyName]);
    }

    // 2. EJECUTAR LA BÚSQUEDA
    const contracts = await this.odoo.executeKw<any[]>(
      'hr.contract',
      'search_read',
      [domain], // Pasamos el dominio construido
      {
        fields: ['employee_id', 'resource_calendar_id', 'job_id'],
        order: 'employee_id asc'
      },
      uid,
    );

    // Si no hay contratos para esa compañía, retornamos vacío de inmediato
    if (!contracts || contracts.length === 0) return [];

    const calendarIds = [...new Set(contracts.map(c => c.resource_calendar_id?.[0]).filter(id => !!id))];

    // 3. OBTENER LAS MALLAS
    let allMallas: any[] = [];
    if (calendarIds.length > 0) {
      allMallas = await this.odoo.executeKw<any[]>(
        'resource.calendar.attendance',
        'search_read',
        [[['calendar_id', 'in', calendarIds], ['dayofweek', '=', dayOfWeekOdoo]]],
        { fields: ['calendar_id', 'hour_from', 'hour_to', 'day_period'] },
        uid,
      );
    }

    // 4. MAPEO FINAL
    return contracts.map(con => {
      // Buscamos si el contrato tiene una malla para el día de hoy
      const mallaEmp = allMallas.find(m => m.calendar_id[0] === con.resource_calendar_id?.[0]);

      let horario = 'No programado';
      let jornada = 'N/A';

      if (mallaEmp) {
        horario = `${this.formatDecimal(mallaEmp.hour_from)} - ${this.formatDecimal(mallaEmp.hour_to)}`;
        const period = mallaEmp.day_period;
        jornada = period === 'morning' ? 'Diurna' : period === 'afternoon' ? 'Tarde' : 'Nocturna';
      }

      return {
        nombre: con.employee_id ? con.employee_id[1] : 'Sin Nombre',
        cc: 'Consultando...',
        malla: con.resource_calendar_id ? con.resource_calendar_id[1] : 'Sin Malla',
        jornada: jornada,
        horario: horario
      };
    });
  }

  async getReporteNovedades(soloHoy?: boolean, companyName?: string) {
    const uid = await this.odoo.authenticate();
    let domain: any[] = [];

    if (soloHoy) {
      const hoy = new Date().toLocaleDateString('en-CA');
      domain.push(['check_in', '>=', `${hoy} 00:00:00`]);
      domain.push(['check_in', '<=', `${hoy} 23:59:59`]);
    }

    if (companyName && companyName.trim() !== "") {
      domain.push(['employee_id.company_id.name', '=', companyName]);
    }

    const camposABuscar = ['employee_id', 'check_in', 'check_out', 'department_id', 'x_studio_comentario', 'x_studio_salida'];
    if (this.ENVIAR_CAMPOS_STUDIO) {
      camposABuscar.push('x_studio_comentario', 'x_studio_salida');
    }

    const attendances = await this.odoo.executeKw<any[]>(
      'hr.attendance',
      'search_read',
      [domain],
      {
        fields: camposABuscar,
        order: 'check_in desc',
        limit: soloHoy ? 500 : 100,
      },
      uid,
    );

    return attendances.map(att => {
      let estadoFinal = 'A TIEMPO';
      if (this.ENVIAR_CAMPOS_STUDIO) {
        estadoFinal = att.x_studio_salida || att.x_studio_comentario || 'A TIEMPO';
      }

      return {
        id: att.id,
        empleado: att.employee_id ? att.employee_id[1] : 'Desconocido',
        department_id: att.department_id ? att.department_id[1] : 'SIN DEPTO',
        comentario: att.x_studio_comentario || 'N/A',
        salida: att.x_studio_salida || 'N/A',

        // VOLVEMOS A LA HORA PURA DE ODOO (Sin transformaciones de servidor)
        check_in: att.check_in || null,
        check_out: att.check_out || null,
        estado: estadoFinal.toUpperCase(),
        fecha: att.check_in ? att.check_in.split(' ')[0] : 'N/A'
      };
    });
  }

  // Función auxiliar para convertir 8.5 a "08:30"
  private formatDecimal(decimal: number): string {
    const hrs = Math.floor(decimal);
    const mins = Math.round((decimal - hrs) * 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private calcularEstadoAsistencia(horaMalla: number, tipo: 'in' | 'out'): string {
    const ahora = new Date();
    // Hora local en decimal
    const horaActualDecimal = ahora.getHours() + ahora.getMinutes() / 60;
    const tolerancia = 6 / 60; // 6 minutos de margen

    if (tipo === 'in') {
      // Si la hora actual es mayor a la malla + tolerancia = TARDE
      return horaActualDecimal > (horaMalla + tolerancia) ? "ENTRADA TARDE" : "A TIEMPO";
    } else {
      // Si la hora actual es menor a la malla = SALIDA ANTICIPADA
      return horaActualDecimal < horaMalla ? "SALIDA ANTICIPADA" : "A TIEMPO";
    }
  }

}