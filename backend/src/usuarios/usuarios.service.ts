import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { OdooService } from '../odoo/odoo.service';
import {
  getFechaColombia,
  decimalToMinutes,
} from '../common/utils/fecha.utils';

@Injectable()
export class UsuariosService {
  constructor(private readonly odoo: OdooService) { }

  // CONFIGURACIÓN: Cambiar a 'true' solo si los campos existen en el Odoo actual
  private readonly ENVIAR_CAMPOS_STUDIO =
    process.env.ENABLE_STUDIO_FIELDS === 'true';

  async login(usuario: string, password: string) {
    const { inicioDia, ahoraStr } = getFechaColombia();

    if (!usuario || !password) {
      throw new BadRequestException('Por favor, ingrese usuario y contraseña');
    }

    if (usuario !== password) {
      throw new UnauthorizedException(
        'La contraseña no coincide con el usuario',
      );
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
    const status = await this.getAttendanceStatus(emp.id);

    // 2. LÓGICA DE ROLES
    //const palabrasAdmin = ['GERENTE', 'COORDINADOR', 'JEFE', 'DESARROLLADOR'];
    const palabrasAdmin = ['DESARROLLADOR'];
    const esSuperAdmin = cargo.includes('DESARROLLADOR');
    const esSubalterno = [
      'AUXILIAR',
      'PRACTICANTE',
      'ANALISTA',
      'APRENDIZ',
      'ASISTENTE',
      'INSPECTOR',
    ].some((word) => cargo.includes(word));

    const esTI =
      cargo === 'TI' ||
      cargo.includes(' TI ') ||
      cargo.startsWith('TI ') ||
      cargo.endsWith(' TI');
    const tieneMandoGeneral = palabrasAdmin.some((palabra) =>
      cargo.includes(palabra),
    );

    const esAdmin = (tieneMandoGeneral || esTI) && !esSubalterno;
    const rolAsignado = esAdmin ? 'admin' : 'user';

    // 3. VALIDACIÓN DE ESTADO (ASISTENCIA)
    // ¿Tiene algo abierto actualmente?
    const openAttendances = await this.odoo.executeKw<any[]>(
      'hr.attendance',
      'search_read',
      [
        [
          ['employee_id', '=', emp.id],
          ['check_out', '=', false],
        ],
      ],
      { fields: ['check_in'], limit: 1 },
      uid,
    );
    let isInside = openAttendances.length > 0;
    let dayCompleted = false;

    // 4. LÓGICA DE CIERRE AUTOMÁTICO (Evitar bloqueo de día nuevo)
    const lastCompleted = await this.odoo.executeKw<any[]>(
      'hr.attendance',
      'search_read',
      [
        [
          ['employee_id', '=', emp.id],
          ['check_out', '>=', inicioDia],
        ],
      ],
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
      day_completed: status.day_completed,
    };
  }

  async attendance(employee_id: number) {
    try {
      // 1. OBTENER FECHAS REALES
      // ahoraStr = Local Colombia | fechaHoraISO = UTC para Odoo
      const { ahoraStr, hoyFechaCorta, fechaHoraISO } = getFechaColombia();
      const ahoraCol = new Date(
        new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }),
      );

      let estadoCalculado = 'A TIEMPO';
      let infoMalla = 'SIN MALLA ASIGNADA';
      let autoCerrado = false;

      const uid = await this.odoo.authenticate();

      // 2. BUSCAR SESIÓN ACTIVA (Entrada sin salida)
      const lastAtt = await this.odoo.executeKw<any[]>(
        'hr.attendance',
        'search_read',
        [
          [
            ['employee_id', '=', employee_id],
            ['check_out', '=', false],
          ],
        ],
        { fields: ['id', 'check_in'], limit: 1 },
        uid,
      );

      let activeSession = lastAtt && lastAtt.length > 0;

      // 3. VALIDACIÓN DE JORNADA COMPLETADA
      // 3. VALIDACIÓN DE JORNADA COMPLETADA
      if (!activeSession) {
        // Usamos el inicio del día local para filtrar
        // Odoo comparará este string con sus registros en UTC
        const registroHoy = await this.odoo.executeKw<any[]>(
          'hr.attendance',
          'search_read',
          [
            [
              ['employee_id', '=', employee_id],
              // Buscamos desde las 00:00:00 de hoy en Colombia
              ['check_in', '>=', `${hoyFechaCorta} 00:00:00`],
              ['check_out', '!=', false],
            ],
          ],
          {
            fields: ['id', 'check_in', 'check_out'],
            limit: 1,
            order: 'check_in desc', // Traer el más reciente
          },
          uid,
        );

        if (registroHoy && registroHoy.length > 0) {
          // Log de control para saber qué registro bloqueó la entrada
          console.log('Bloqueo por jornada finalizada:', registroHoy[0]);

          return {
            status: 'success',
            type: 'completed',
            message: 'JORNADA YA FINALIZADA HOY',
            is_inside: false,
            day_completed: true,
            malla: 'SISTEMA BLOQUEADO',
          };
        }
      }

      // 4. LÓGICA DE AUTO-CIERRE (Si hay sesión de días anteriores)
      if (activeSession) {
        // Comparamos la fecha de entrada (UTC) con el hoy de Colombia
        // Convertimos la fecha de Odoo a fecha corta local para comparar
        const checkInLocal = new Date(lastAtt[0].check_in + ' UTC')
          .toLocaleString('en-CA', { timeZone: 'America/Bogota' })
          .split(',')[0];

        if (checkInLocal !== hoyFechaCorta) {
          // Si el registro es de otro día, cerramos a las 04:59:59 UTC
          // (Que son las 23:59:59 de ese día en Colombia)
          const diaEntrada = lastAtt[0].check_in.split(' ')[0];
          const cierreCompensado = `${diaEntrada} 23:59:59`; // Se guarda como texto UTC

          await this.odoo.executeKw(
            'hr.attendance',
            'write',
            [
              [lastAtt[0].id],
              {
                check_out: cierreCompensado,
                x_studio_tipo_salida: 'CIERRE AUTOMÁTICO',
              },
            ],
            {},
            uid,
          );
          activeSession = false;
          autoCerrado = true;
        }
      }

      // 5. LÓGICA DE MALLAS (Aquí usamos hora local Bogotá siempre)
      const contracts = await this.odoo.executeKw<any[]>(
        'hr.contract',
        'search_read',
        [
          [
            ['employee_id', '=', employee_id],
            ['state', 'in', ['open', 'draft']],
          ],
        ],
        { fields: ['resource_calendar_id'], limit: 1 },
        uid,
      );

      if (contracts?.length > 0 && contracts[0].resource_calendar_id) {
        const calId = contracts[0].resource_calendar_id[0];
        const calNombre = contracts[0].resource_calendar_id[1];
        const dayOfWeekOdoo = (
          ahoraCol.getDay() === 0 ? 6 : ahoraCol.getDay() - 1
        ).toString();
        const horaActualDecimal =
          ahoraCol.getHours() + ahoraCol.getMinutes() / 60;

        const mallas = await this.odoo.executeKw<any[]>(
          'resource.calendar.attendance',
          'search_read',
          [
            [
              ['calendar_id', '=', calId],
              ['dayofweek', '=', dayOfWeekOdoo],
            ],
          ],
          { fields: ['hour_from', 'hour_to'] },
          uid,
        );

        if (mallas.length > 0) {
          const mallaTurno = mallas.sort(
            (a, b) => a.hour_from - b.hour_from,
          )[0];
          const tolerancia = 6 / 60;

          if (!activeSession) {
            if (horaActualDecimal > mallaTurno.hour_from + tolerancia)
              estadoCalculado = 'ENTRADA TARDE';
          } else {
            if (horaActualDecimal < mallaTurno.hour_to)
              estadoCalculado = 'SALIDA ANTICIPADA';
          }
          infoMalla = `Malla: ${calNombre}`;
        }
      }

      // 6. REGISTRO FINAL EN ODOO (USANDO UTC)
      let typeResult = '';
      // IMPORTANTE: Enviamos fechaHoraISO (UTC)
      if (activeSession) {
        await this.odoo.executeKw(
          'hr.attendance',
          'write',
          [
            [lastAtt[0].id],
            { check_out: fechaHoraISO, x_studio_tipo_salida: estadoCalculado },
          ],
          {},
          uid,
        );
        typeResult = 'out';
      } else {
        await this.odoo.executeKw(
          'hr.attendance',
          'create',
          [
            {
              employee_id,
              check_in: fechaHoraISO,
              x_studio_tipo_entrada: estadoCalculado,
            },
          ],
          {},
          uid,
        );
        typeResult = 'in';
      }

      // 7. RESPUESTA
      const finalStatus = await this.getAttendanceStatus(employee_id);
      return {
        status: 'success',
        type: typeResult,
        message: autoCerrado
          ? `Auto-Cierre: ${estadoCalculado}`
          : estadoCalculado,
        malla: infoMalla,
        is_inside: finalStatus.is_inside,
        day_completed: finalStatus.day_completed,
      };
    } catch (error) {
      console.error('Error crítico en attendance:', error);
      return {
        status: 'error',
        message: 'Error interno',
        type: 'server_error',
      };
    }
  }
  // Agrega esto dentro de la clase UsuariosService
  async getAllMallas(companyName?: string) {
    const uid = await this.odoo.authenticate();
    const now = new Date();
    const dayOfWeekOdoo = (
      now.getDay() === 0 ? 6 : now.getDay() - 1
    ).toString();

    // 1. CONSTRUIR EL DOMINIO CORRECTAMENTE
    // Iniciamos con los filtros fijos
    const domain: any[] = [
      ['state', 'in', ['open', 'draft']],
      ['employee_id.active', '=', true],
    ];

    // Agregamos la compañía solo si viene el parámetro
    if (companyName && companyName.trim() !== '') {
      domain.push(['employee_id.company_id.name', '=', companyName]);
    }

    // 2. EJECUTAR LA BÚSQUEDA
    const contracts = await this.odoo.executeKw<any[]>(
      'hr.contract',
      'search_read',
      [domain], // Pasamos el dominio construido
      {
        fields: ['employee_id', 'resource_calendar_id', 'job_id'],
        order: 'employee_id asc',
      },
      uid,
    );

    // Si no hay contratos para esa compañía, retornamos vacío de inmediato
    if (!contracts || contracts.length === 0) return [];

    const calendarIds = [
      ...new Set(
        contracts.map((c) => c.resource_calendar_id?.[0]).filter((id) => !!id),
      ),
    ];

    // 3. OBTENER LAS MALLAS
    let allMallas: any[] = [];
    if (calendarIds.length > 0) {
      allMallas = await this.odoo.executeKw<any[]>(
        'resource.calendar.attendance',
        'search_read',
        [
          [
            ['calendar_id', 'in', calendarIds],
            ['dayofweek', '=', dayOfWeekOdoo],
          ],
        ],
        { fields: ['calendar_id', 'hour_from', 'hour_to', 'day_period'] },
        uid,
      );
    }

    // 4. MAPEO FINAL
    return contracts.map((con) => {
      // Buscamos si el contrato tiene una malla para el día de hoy
      const mallaEmp = allMallas.find(
        (m) => m.calendar_id[0] === con.resource_calendar_id?.[0],
      );

      let horario = 'No programado';
      let jornada = 'N/A';

      if (mallaEmp) {
        horario = `${this.formatDecimal(mallaEmp.hour_from)} - ${this.formatDecimal(mallaEmp.hour_to)}`;
        const period = mallaEmp.day_period;
        jornada =
          period === 'morning'
            ? 'Diurna'
            : period === 'afternoon'
              ? 'Tarde'
              : 'Nocturna';
      }

      return {
        nombre: con.employee_id ? con.employee_id[1] : 'Sin Nombre',
        cc: 'Consultando...',
        malla: con.resource_calendar_id
          ? con.resource_calendar_id[1]
          : 'Sin Malla',
        cargo: con.job_id ? con.job_id[1] : 'Sin Cargo',
        jornada: jornada,
        horario: horario,
      };
    });
  }

  async getReporteNovedades(soloHoy?: boolean,
    companyName?: string,
    startDate?: string,
    endDate?: string) {
    const uid = await this.odoo.authenticate();
    let domain: any[] = [];

    // 1. Lógica de Fecha (Solo filtrar si hoy es TRUE)
    // 1. Lógica de Fecha mejorada para soportar históricos
    if (soloHoy) {
      // Si es hoy, forzamos el rango del día actual
      const hoy = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
      domain.push(['check_in', '>=', `${hoy} 00:00:00`]);
      domain.push(['check_in', '<=', `${hoy} 23:59:59`]);
    } else {
      // Si NO es hoy, revisamos si vienen fechas desde el frontend (calendario)
      if (startDate) {
        domain.push(['check_in', '>=', `${startDate} 00:00:00`]);
      }
      if (endDate) {
        domain.push(['check_in', '<=', `${endDate} 23:59:59`]);
      }
    }

    // 2. Filtro de Compañía (Solo si viene un nombre válido)
    if (companyName && companyName.trim() !== '' && companyName !== 'Todas') {
      domain.push(['employee_id.company_id.name', '=', companyName]);
    }

    // 3. Campos a buscar
    const camposABuscar = [
      'employee_id',
      'check_in',
      'check_out',
      'department_id',
      'x_studio_tipo_entrada',
      'x_studio_tipo_salida',
    ];

    if (this.ENVIAR_CAMPOS_STUDIO) {
      camposABuscar.push('x_studio_tipo_entrada', 'x_studio_tipo_salida');
    }

    // 4. Ejecución en Odoo
    const attendances = await this.odoo.executeKw<any[]>(
      'hr.attendance',
      'search_read',
      [domain],
      {
        fields: camposABuscar,
        order: 'check_in desc',
        // Si es hoy limitamos a 500, si es histórico subimos a 10,000 
        // para asegurar que los registros de 2025 aparezcan.
        limit: soloHoy ? 500 : 10000,
      },
      uid,
    );

    // 5. Mapeo de resultados
    return attendances.map((att) => {
      // let estadoFinal = 'A TIEMPO';
      // if (this.ENVIAR_CAMPOS_STUDIO) {
      //   // Priorizar salida si existe, sino entrada
      //   estadoFinal =
      //     att.x_studio_tipo_salida || att.x_studio_tipo_entrada || 'A TIEMPO';
      // }

      return {
        id: att.id,
        empleado: att.employee_id ? att.employee_id[1] : 'Desconocido',
        department_id: att.department_id ? att.department_id[1] : 'SIN DEPTO',
        c_entrada: att.x_studio_tipo_entrada || 'N/A',
        c_salida: att.x_studio_tipo_salida || 'N/A',
        check_in: att.check_in || null,
        check_out: att.check_out || null,
        fecha: att.check_in ? att.check_in.split(' ')[0] : 'N/A',
      };
    });
  }
  async getAttendanceStatus(employee_id: number) {
    try {
      const { hoyFechaCorta } = getFechaColombia();
      const uid = await this.odoo.authenticate();

      // 1. Buscamos cualquier sesión abierta (check_out = false)
      const lastAtt = await this.odoo.executeKw<any[]>(
        'hr.attendance',
        'search_read',
        [
          [
            ['employee_id', '=', employee_id],
            ['check_out', '=', false],
          ],
        ],
        { fields: ['id', 'check_in'], limit: 1, order: 'check_in desc' },
        uid,
      );

      let isInside = lastAtt && lastAtt.length > 0;

      // 2. CORRECCIÓN CRÍTICA DE FECHA:
      // Convertimos la fecha UTC de Odoo a la fecha corta de Colombia para comparar peras con peras
      if (isInside) {
        const checkInUTC = lastAtt[0].check_in; // Ejemplo: "2026-01-20 04:15:43"

        // Convertimos ese string UTC a fecha local de Bogotá (YYYY-MM-DD)
        const checkInLocalCorta = new Date(checkInUTC + ' UTC').toLocaleString(
          'en-CA',
          {
            timeZone: 'America/Bogota',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          },
        );

        // Si la fecha local de la entrada no es hoy, lo tratamos como "fuera"
        // para que la función principal lo cierre automáticamente.
        if (checkInLocalCorta !== hoyFechaCorta) {
          console.log(
            `Sesión antigua detectada: Entrada local ${checkInLocalCorta} vs Hoy ${hoyFechaCorta}`,
          );
          isInside = false;
        }
      }

      let dayCompleted = false;

      // 3. Si no está adentro, verificamos si ya terminó su jornada hoy
      if (!isInside) {
        const registroHoy = await this.odoo.executeKw<any[]>(
          'hr.attendance',
          'search_read',
          [
            [
              ['employee_id', '=', employee_id],
              ['check_in', '>=', `${hoyFechaCorta} 00:00:00`],
              ['check_out', '!=', false],
            ],
          ],
          { fields: ['id'], limit: 1, order: 'check_in desc' },
          uid,
        );
        dayCompleted = registroHoy && registroHoy.length > 0;
      }

      console.log('--- STATUS FINAL ---', { isInside, dayCompleted });
      return { is_inside: isInside, day_completed: dayCompleted };
    } catch (e) {
      console.error('Error en getAttendanceStatus:', e);
      return { is_inside: false, day_completed: false };
    }
  }
  // Función auxiliar para convertir 8.5 a "08:30"
  private formatDecimal(decimal: number): string {
    const hrs = Math.floor(decimal);
    const mins = Math.round((decimal - hrs) * 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private calcularEstadoAsistencia(
    horaMalla: number,
    tipo: 'in' | 'out',
  ): string {
    const ahora = new Date();
    // Hora local en decimal
    const horaActualDecimal = ahora.getHours() + ahora.getMinutes() / 60;
    const tolerancia = 6 / 60; // 6 minutos de margen

    if (tipo === 'in') {
      // Si la hora actual es mayor a la malla + tolerancia = TARDE
      return horaActualDecimal > horaMalla + tolerancia
        ? 'ENTRADA TARDE'
        : 'A TIEMPO';
    } else {
      // Si la hora actual es menor a la malla = SALIDA ANTICIPADA
      return horaActualDecimal < horaMalla ? 'SALIDA ANTICIPADA' : 'A TIEMPO';
    }
  }
}
