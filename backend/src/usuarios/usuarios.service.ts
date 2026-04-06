import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { OdooService } from '../odoo/odoo.service';
import { Usuario } from './entities/usuario.entity';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  getFechaColombia,
  decimalToMinutes,
} from '../common/utils/fecha.utils';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { Repository } from 'typeorm/repository/Repository.js';
import { Permiso } from './entities/permiso.entity';
import { PermisoDepartamento } from './entities/permiso-departamento.entity';
import * as fs from 'fs';
import * as path from 'path';
import { Area } from './entities/area.entity';

@Injectable()
export class UsuariosService {
  private syncProgress = {
    current: 0,
    total: 0,
    isCancelled: false,
    status: 'idle',
  };
  private readonly rootPath = path.resolve(
    __dirname,
    '..',
    '..',
    'uploads',
    'apk',
  );
  private readonly apkPath = path.join(this.rootPath, 'app-debug.apk'); // Verifica si se llama así o app.apk
  private readonly jsonPath = path.join(this.rootPath, 'changelog.json');
  constructor(
    // ESTO ES LO QUE FALTA: Inyectar el repositorio
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,

    @InjectRepository(Permiso)
    private readonly permisoRepo: Repository<Permiso>,

    private readonly odoo: OdooService,

    private dataSource: DataSource,
    private configService: ConfigService,

    @InjectRepository(Area)
    private readonly areaRepo: Repository<Area>,
    @InjectRepository(PermisoDepartamento) // 👈 agrega
    private readonly permisoDeptRepo: Repository<PermisoDepartamento>,
  ) {}

  // CONFIGURACIÓN: Cambiar a 'true' solo si los campos existen en el Odoo actual
  private readonly ENVIAR_CAMPOS_STUDIO =
    process.env.ENABLE_STUDIO_FIELDS === 'true';

  async login(usuario: string, password: string) {
    const { inicioDia, ahoraStr } = getFechaColombia();
    console.log(`\n--- INTENTO DE LOGIN: ${usuario} ---`);
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
      {
        fields: ['id', 'name', 'job_id', 'department_id', 'coach_id'],
        limit: 1,
      },
      uid,
    );

    if (!employees || employees.length === 0) {
      throw new NotFoundException('El usuario no existe en la base de datos');
    }

    const emp = employees[0];
    console.log('--- DATOS CRUDOS DE ODOO ---');
    console.dir(emp, { depth: null });
    const cargoRaw = emp.job_id ? emp.job_id[1] : 'SIN CARGO';
    const departamentoRaw = emp.department_id
      ? emp.department_id[1]
      : 'SIN DEPARTAMENTO';

    // 1. NORMALIZACIÓN: Quitamos tildes y pasamos a mayúsculas
    // Esto evita que "Información" no coincida con "INFORMACION"
    const cargo = cargoRaw
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    console.log(`[CARGO]: Original: "${cargoRaw}" | Normalizado: "${cargo}"`);
    console.log(`[LOGIN]: Usuario: ${emp.name} | Depto: ${departamentoRaw}`);

    const status = await this.getAttendanceStatus(emp.id);

    // 2. DETECCIÓN DE CASOS ESPECIALES
    // Buscamos palabras clave en lugar de la frase exacta para evitar líos con el "+" o espacios
    const esAnalistaMallasAdmin =
      cargo.includes('ANALISTA') && cargo.includes('MALLAS');

    // 3. LÓGICA DE ROLES
    const palabrasAdmin = ['DESARROLLADOR'];

    const esSuperAdmin = ['DESARROLLADOR'].some((palabra) =>
      cargo.includes(palabra),
    );

    // TI: Usamos una expresión regular para buscar la palabra exacta "TI"
    const esTI = /\b(IT|TI)\b/i.test(cargo);

    // Si tiene palabra de mando O es el analista especial de mallas
    const tieneMandoGeneral =
      palabrasAdmin.some((palabra) => cargo.includes(palabra)) ||
      esAnalistaMallasAdmin;

    // Si está en la lista de usuarios PERO no es nuestro analista especial
    const esUser =
      [
        'AUXILIAR',
        'PRACTICANTE',
        'ANALISTA',
        'APRENDIZ',
        'ASISTENTE',
        'INSPECTOR',
      ].some((word) => cargo.includes(word)) && !esAnalistaMallasAdmin;

    // 4. ASIGNACIÓN FINAL
    // Ahora esAdmin será true para el Analista de Mallas porque tieneMandoGeneral es true
    const esAdmin = tieneMandoGeneral || esTI;
    const rolAsignado = esAdmin ? 'admin' : 'user';

    // 1. BUSCAR PERMISOS EN LA BASE DE DATOS LOCAL
    const permisosDB = await this.permisoRepo.find({
      where: { usuario_id_odoo: emp.id },
    });

    const mapaPermisos = permisosDB.reduce((acc, p) => {
      acc[p.modulos] = p.nivel_acceso === 'admin';
      return acc;
    }, {});

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
      id_odoo: emp.id,
      employee_id: emp.id,
      name: emp.name,
      job: cargoRaw,
      role: rolAsignado,
      is_inside: isInside,
      department: departamentoRaw,
      isSuperAdmin: esSuperAdmin,
      day_completed: dayCompleted, // Usamos la variable local que calculamos arriba

      permisos: mapaPermisos,
    };
  }
  async asignarModuloPermiso(
    idOdoo: number,
    modulo: string,
    nivel: string,
    adminName: string,
  ) {
    // 1. Verificamos si ya existe el permiso
    const existe = await this.permisoRepo.findOne({
      where: { usuario_id_odoo: idOdoo, modulos: modulo },
    });

    if (existe) {
      // 2. Si existe, actualizamos el nivel y quién lo asignó
      existe.nivel_acceso = nivel;
      existe.asignado_por = adminName;
      return await this.permisoRepo.save(existe);
    }

    // 3. Si no existe, creamos la fila nueva
    const nuevoPermiso = this.permisoRepo.create({
      usuario_id_odoo: idOdoo,
      modulos: modulo,
      nivel_acceso: nivel,
      asignado_por: adminName,
    });

    return await this.permisoRepo.save(nuevoPermiso);
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
  async getAllMallas(companyName?: string, departamentoName?: string) {
    const uid = await this.odoo.authenticate();
    const now = new Date();
    const dayOfWeekOdoo = (
      now.getDay() === 0 ? 6 : now.getDay() - 1
    ).toString();

    const domain: any[] = [
      ['state', 'in', ['open', 'draft']],
      ['employee_id.active', '=', true],
    ];

    if (companyName && companyName.trim() !== '') {
      domain.push(['employee_id.company_id.name', '=', companyName]);
    }
    if (
      departamentoName &&
      departamentoName.trim() !== '' &&
      departamentoName !== 'Todas'
    ) {
      domain.push([
        'employee_id.department_id.name',
        'ilike',
        departamentoName,
      ]);
    }

    // 2. EJECUTAR LA BÚSQUEDA
    const contracts = await this.odoo.executeKw<any[]>(
      'hr.contract',
      'search_read',
      [domain],
      {
        fields: [
          'employee_id',
          'resource_calendar_id',
          'job_id',
          'department_id', // Departamento del contrato
        ],
        order: 'employee_id asc',
      },
      uid,
    );

    if (!contracts || contracts.length === 0) return [];

    // --- NUEVA LÓGICA: Obtener detalles de los Empleados ---
    // Extraemos los IDs de los empleados de los contratos
    const employeeIds = [...new Set(contracts.map((c) => c.employee_id[0]))];

    const employeesDetail = await this.odoo.executeKw<any[]>(
      'hr.employee',
      'search_read',
      [[['id', 'in', employeeIds]]],
      {
        fields: ['id', 'job_title', 'department_id'],
      },
      uid,
    );

    // 3. OBTENER LAS MALLAS (Se mantiene igual)
    const calendarIds = [
      ...new Set(
        contracts.map((c) => c.resource_calendar_id?.[0]).filter((id) => !!id),
      ),
    ];
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

    // 4. MAPEO FINAL MEJORADO
    return contracts.map((con) => {
      // Buscamos el detalle del empleado para rescatar cargo/depto si el contrato no los tiene
      const empInfo = employeesDetail.find((e) => e.id === con.employee_id[0]);

      const mallaEmp = allMallas.find(
        (m) => m.calendar_id[0] === con.resource_calendar_id?.[0],
      );
      // console.log('resource_calendar_id:', con.resource_calendar_id);
      // console.log('allMallas[0]:', allMallas[0]); // ver estructura real

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

        // PRIORIDAD: 1. Depto Contrato -> 2. Depto Empleado -> 3. "No asignado"
        departamento: Array.isArray(con.department_id)
          ? con.department_id[1]
          : empInfo && Array.isArray(empInfo.department_id)
            ? empInfo.department_id[1]
            : 'No asignado',

        malla: con.resource_calendar_id
          ? con.resource_calendar_id[1]
          : 'Sin Malla',

        // PRIORIDAD: 1. Cargo Contrato -> 2. Job Title de Empleado -> 3. "No asignado"
        cargo: Array.isArray(con.job_id)
          ? con.job_id[1]
          : empInfo && empInfo.job_title
            ? empInfo.job_title
            : 'No asignado',

        jornada: jornada,
        horario: horario,
      };
    });
  }
  // ==========================================
  // MÉTODOS PRIVADOS
  // ==========================================

  private async getMallasMap(
    employeeIds: number[],
    uid: number,
  ): Promise<{
    calendarMap: Record<number, { calId: number; calNombre: string }>;
    mallasMap: Record<number, any[]>;
  }> {
    const calendarMap: Record<number, { calId: number; calNombre: string }> =
      {};
    const mallasMap: Record<number, any[]> = {};

    if (employeeIds.length === 0) return { calendarMap, mallasMap };

    const contratos = await this.odoo.executeKw<any[]>(
      'hr.contract',
      'search_read',
      [
        [
          ['employee_id', 'in', employeeIds],
          ['state', 'in', ['open', 'draft']],
        ],
      ],
      { fields: ['employee_id', 'resource_calendar_id'] },
      uid,
    );

    contratos.forEach((c) => {
      if (c.resource_calendar_id) {
        calendarMap[c.employee_id[0]] = {
          calId: c.resource_calendar_id[0],
          calNombre: c.resource_calendar_id[1],
        };
      }
    });

    const calIds = [...new Set(Object.values(calendarMap).map((c) => c.calId))];
    if (calIds.length === 0) return { calendarMap, mallasMap };

    const todasMallas = await this.odoo.executeKw<any[]>(
      'resource.calendar.attendance',
      'search_read',
      [[['calendar_id', 'in', calIds]]],
      { fields: ['calendar_id', 'dayofweek', 'hour_from', 'hour_to'] },
      uid,
    );

    todasMallas.forEach((m) => {
      const cid = m.calendar_id[0];
      if (!mallasMap[cid]) mallasMap[cid] = [];
      mallasMap[cid].push(m);
    });

    return { calendarMap, mallasMap };
  }

  private clasificarPorMalla(
    empId: number,
    punchingTime: string,
    esEntrada: boolean,
    calendarMap: Record<number, { calId: number; calNombre: string }>,
    mallasMap: Record<number, any[]>,
  ): string {
    const cal = calendarMap[empId];
    if (!cal) return 'SIN MALLA';

    const mallas = mallasMap[cal.calId];
    if (!mallas || mallas.length === 0) return 'SIN MALLA';

    const fechaUTC = new Date(punchingTime.replace(' ', 'T') + 'Z');
    const horaLocal = new Date(
      fechaUTC.toLocaleString('en-US', { timeZone: 'America/Bogota' }),
    );
    const dayOfWeekOdoo = (
      horaLocal.getDay() === 0 ? 6 : horaLocal.getDay() - 1
    ).toString();
    const horaDecimal = horaLocal.getHours() + horaLocal.getMinutes() / 60;

    const mallasDelDia = mallas
      .filter((m) => m.dayofweek === dayOfWeekOdoo)
      .sort((a, b) => a.hour_from - b.hour_from);

    if (mallasDelDia.length === 0) return 'DÍA NO LABORABLE';

    const turno = mallasDelDia[0];
    const tolerancia = 6 / 60;

    if (esEntrada) {
      return horaDecimal > turno.hour_from + tolerancia
        ? 'ENTRADA TARDE'
        : 'A TIEMPO';
    } else {
      return horaDecimal < turno.hour_to ? 'SALIDA ANTICIPADA' : 'A TIEMPO';
    }
  }

  private mapAttendances(
    attendances: any[],
    partnerMap: Record<string, string>,
    toLocal: (d: string) => string | null,
  ): any[] {
    return attendances.map((att) => {
      const localIn = toLocal(att.check_in);
      const localOut = toLocal(att.check_out);
      const nombre = att.employee_id ? att.employee_id[1] : 'Desconocido';

      return {
        id: `att_${att.id}`,
        empleado: nombre,
        cc: partnerMap[nombre] || 'N/A',
        department_id: att.department_id ? att.department_id[1] : 'SIN DEPTO',
        c_entrada: att.x_studio_tipo_entrada || 'A TIEMPO',
        c_salida: att.x_studio_tipo_salida || 'N/A',
        check_in: localIn,
        check_out: localOut,
        fecha: localIn ? localIn.split(' ')[0] : 'N/A',
        tipo: 'ASISTENCIA',
        estado: att.check_out ? 'Finalizado' : 'En curso',
      };
    });
  }

  private async mapLogs(
    logs: any[],
    partnerMap: Record<string, string>,
    toLocal: (d: string) => string | null,
    uid: number,
  ): Promise<any[]> {
    const employeeIdsLogs = [
      ...new Set(logs.map((l) => l.employee_id?.[0]).filter(Boolean)),
    ];
    const { calendarMap, mallasMap } = await this.getMallasMap(
      employeeIdsLogs,
      uid,
    );

    // --- AGRUPAR POR EMPLEADO + DÍA ---
    const grupos: Record<
      string,
      { empId: number; nombre: string; dept: string; registros: any[] }
    > = {};

    logs.forEach((log) => {
      const empId = log.employee_id?.[0];
      const nombre = log.employee_id?.[1] || 'Desconocido';
      const localTime = toLocal(log.punching_time);
      const fecha = localTime ? localTime.split(' ')[0] : 'SIN_FECHA';
      const key = `${empId}_${fecha}`;

      if (!grupos[key]) {
        grupos[key] = {
          empId,
          nombre,
          dept: log.x_studio_related_field_j40wn
            ? log.x_studio_related_field_j40wn[1]
            : 'SIN DEPTO',
          registros: [],
        };
      }
      grupos[key].registros.push(log);
    });

    // --- MAPEAR UN REGISTRO POR GRUPO (MIN y MAX) ---
    return Object.entries(grupos).flatMap(([key, grupo]) => {
      const { empId, nombre, dept, registros } = grupo;

      const ordenados = registros.sort(
        (a, b) =>
          new Date(a.punching_time).getTime() -
          new Date(b.punching_time).getTime(),
      );

      const primero = ordenados[0];
      const ultimo = ordenados[ordenados.length - 1];

      // Verificar si el último ya superó hour_to
      let jornadadFinalizada = false;
      if (empId && ordenados.length > 1) {
        const cal = calendarMap[empId];
        if (cal) {
          const mallasDelCal = mallasMap[cal.calId] || [];
          const fechaUTC = new Date(
            ultimo.punching_time.replace(' ', 'T') + 'Z',
          );
          const horaLocal = new Date(
            fechaUTC.toLocaleString('en-US', { timeZone: 'America/Bogota' }),
          );
          const dayOfWeekOdoo = (
            horaLocal.getDay() === 0 ? 6 : horaLocal.getDay() - 1
          ).toString();
          const horaDecimalUltimo =
            horaLocal.getHours() + horaLocal.getMinutes() / 60;
          const mallasDelDia = mallasDelCal
            .filter((m) => m.dayofweek === dayOfWeekOdoo)
            .sort((a, b) => a.hour_from - b.hour_from);

          if (mallasDelDia.length > 0) {
            jornadadFinalizada = horaDecimalUltimo >= mallasDelDia[0].hour_to;
          }
        }
      }

      return ordenados.map((log, index) => {
        const localTime = toLocal(log.punching_time);
        const esPrimero = index === 0;

        let cEntrada = 'N/A';
        let cSalida = 'N/A';
        let estado = 'En curso';
        let checkOut: string | null = null;

        if (esPrimero) {
          // Clasificar entrada con el primero
          const clasificacionEntrada = empId
            ? this.clasificarPorMalla(
                empId,
                log.punching_time,
                true,
                calendarMap,
                mallasMap,
              )
            : 'SIN MALLA';
          cEntrada = `${clasificacionEntrada} | BIOMÉTRICO`;

          // Si jornada finalizada, poner salida también en el primero
          if (jornadadFinalizada) {
            const clasificacionSalida = empId
              ? this.clasificarPorMalla(
                  empId,
                  ultimo.punching_time,
                  false,
                  calendarMap,
                  mallasMap,
                )
              : 'SIN MALLA';
            cSalida = `${clasificacionSalida} | BIOMÉTRICO`;
            checkOut = toLocal(ultimo.punching_time); // hora real del último
            estado = 'Finalizado';
          }
        } else {
          // Los del medio solo BIOMÉTRICO
          cEntrada = 'BIOMÉTRICO';
        }

        return {
          id: `log_${empId}_${log.punching_time}`,
          empleado: nombre,
          cc: partnerMap[nombre] || 'N/A',
          department_id: dept,
          check_in: localTime,
          check_out: checkOut,
          c_entrada: cEntrada,
          c_salida: cSalida,
          fecha: localTime ? localTime.split(' ')[0] : 'N/A',
          tipo: 'LOG CRUDO',
          estado,
        };
      });
    });
  }

  async getReporteNovedades(
    soloHoy?: boolean,
    companyName?: string,
    startDate?: string,
    endDate?: string,
    // departamentoName?: string,
    areaId?: number,
    segmentoId?: number,
  ) {
    const uid = await this.odoo.authenticate();
    const { hoyFechaCorta } = getFechaColombia();

    // --- 1. LÓGICA DE FILTRADO LOCAL POR ESTRUCTURA ---
    let employeeIdsPorEstructura: number[] | null = null;
    if (areaId || segmentoId) {
      const where: any = {};
      if (areaId) where.area_id = areaId;
      if (segmentoId) where.segmento_id = segmentoId;

      const usuariosLocales = await this.usuarioRepo.find({
        where,
        select: ['id_odoo'],
      });

      employeeIdsPorEstructura = usuariosLocales
        .map((u) => u.id_odoo)
        .filter((id) => id != null);

      if (employeeIdsPorEstructura.length === 0) return [];
    }

    // --- 2. CONFIGURACIÓN DE FECHAS (Ajuste preciso UTC-5) ---
    const startDay = soloHoy ? hoyFechaCorta : startDate;
    const endDay = soloHoy ? hoyFechaCorta : endDate;

    // IMPORTANTE: Para capturar registros desde las 00:00:00 Colombia,
    // pedimos a Odoo desde las 05:00:00 UTC del mismo día.
    const inicioUTC = startDay ? `${startDay} 05:00:00` : null;

    let finUTC: string | null = null;
    if (endDay) {
      const partes = endDay.split('-');
      const fechaFin = new Date(
        Number(partes[0]),
        Number(partes[1]) - 1,
        Number(partes[2]),
      );
      // Sumamos 1 día para llegar al amanecer del día siguiente en UTC
      fechaFin.setDate(fechaFin.getDate() + 1);

      const anio = fechaFin.getFullYear();
      const mes = String(fechaFin.getMonth() + 1).padStart(2, '0');
      const dia = String(fechaFin.getDate()).padStart(2, '0');

      // Hasta las 04:59:59 UTC (que son las 23:59:59 del día de consulta en Colombia)
      finUTC = `${anio}-${mes}-${dia} 04:59:59`;
    }

    // --- 3. CONSTRUCCIÓN DE DOMINIOS ---
    let domainAtt: any[] = [];
    let domainLog: any[] = [];

    if (inicioUTC) {
      domainAtt.push(['check_in', '>=', inicioUTC]);
      domainLog.push(['punching_time', '>=', inicioUTC]);
    }
    if (finUTC) {
      domainAtt.push(['check_in', '<=', finUTC]);
      domainLog.push(['punching_time', '<=', finUTC]);
    }

    if (companyName && companyName !== 'Todas' && companyName !== '') {
      domainAtt.push(['employee_id.company_id.name', '=', companyName]);
      domainLog.push(['company_id.name', '=', companyName]);
    }

    // if (departamentoName && departamentoName !== 'DEPARTAMENTOS' && departamentoName !== '') {
    //   domainAtt.push(['employee_id.department_id.name', 'ilike', departamentoName]);
    //   domainLog.push(['x_studio_related_field_j40wn.name', 'ilike', departamentoName]);
    // }

    if (employeeIdsPorEstructura && employeeIdsPorEstructura.length > 0) {
      domainAtt.push(['employee_id', 'in', employeeIdsPorEstructura]);
      domainLog.push(['employee_id', 'in', employeeIdsPorEstructura]);
    }

    try {
      const [attendances, logs] = await Promise.all([
        this.odoo.executeKw<any[]>(
          'hr.attendance',
          'search_read',
          [domainAtt],
          {
            fields: [
              'employee_id',
              'check_in',
              'check_out',
              'department_id',
              'x_studio_tipo_entrada',
              'x_studio_tipo_salida',
            ],
            order: 'check_in desc',
            limit: 3000000,
          },
          uid,
        ),
        this.odoo.executeKw<any[]>(
          'attendance.log',
          'search_read',
          [domainLog],
          {
            fields: [
              'employee_id',
              'punching_time',
              'status',
              'x_studio_related_field_j40wn',
              'device',
            ],
            order: 'punching_time desc',
            limit: 3000000,
          },
          uid,
        ),
      ]);
      const nombresAsistencias = attendances.map((a) => a.employee_id?.[1]);
      const nombresLogs = logs.map((l) => l.employee_id?.[1]);
      const nombresUnicos = [
        ...new Set([...nombresAsistencias, ...nombresLogs]),
      ].filter(Boolean);

      let partnerMap: Record<string, string> = {};
      if (nombresUnicos.length > 0) {
        const partners = await this.odoo.executeKw<any[]>(
          'res.partner',
          'search_read',
          [[['name', 'in', nombresUnicos]]],
          { fields: ['name', 'doc_number'] },
          uid,
        );
        partnerMap = Object.fromEntries(
          partners.map((p) => [p.name, p.doc_number]),
        );
      }

      // --- 4. FUNCIÓN CONVERSORA A LOCAL ---
      // const toLocal = (utcDate: string) => {
      //   if (!utcDate) return null;

      //   // Odoo devuelve "YYYY-MM-DD HH:mm:ss"
      //   // Reemplazamos espacio por T y añadimos Z para indicar que es UTC puro
      //   const fechaUTC = new Date(utcDate.replace(' ', 'T') + 'Z');

      //   // Usamos Intl para asegurar que siempre sea formato Colombia, sin importar el servidor
      //   return new Intl.DateTimeFormat('sv-SE', {
      //     // 'sv-SE' da formato YYYY-MM-DD HH:mm:ss
      //     timeZone: 'America/Bogota',
      //     year: 'numeric',
      //     month: '2-digit',
      //     day: '2-digit',
      //     hour: '2-digit',
      //     minute: '2-digit',
      //     second: '2-digit',
      //   })
      //     .format(fechaUTC)
      //     .replace('T', ' ');
      // };

      const toLocal = (utcDate: string) => {
        if (!utcDate) return null;
        const fechaUTC = new Date(utcDate.replace(' ', 'T') + 'Z');
        return new Intl.DateTimeFormat('sv-SE', {
          timeZone: 'America/Bogota',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
          .format(fechaUTC)
          .replace('T', ' ');
      };
      const [resAttendances, resLogs] = await Promise.all([
        Promise.resolve(this.mapAttendances(attendances, partnerMap, toLocal)),
        this.mapLogs(logs, partnerMap, toLocal, uid),
      ]);

      // // --- 5. MAPEO FINAL ---
      // const resAttendances = attendances.map((att) => {
      //   // 1. Convertimos las fechas a local una sola vez por cada registro
      //   const localIn = toLocal(att.check_in);
      //   const localOut = toLocal(att.check_out);

      //   // 2. Obtenemos el nombre para buscar en el mapa de partners
      //   const nombre = att.employee_id ? att.employee_id[1] : 'Desconocido';

      //   // 3. Retornamos el objeto organizado
      //   return {
      //     id: `att_${att.id}`,
      //     empleado: nombre,
      //     cc: partnerMap[nombre] || 'N/A', // Aquí asignamos el documento (Cédula/CC)
      //     department_id: att.department_id ? att.department_id[1] : 'SIN DEPTO',
      //     c_entrada: att.x_studio_tipo_entrada || 'A TIEMPO',
      //     c_salida: att.x_studio_tipo_salida || 'N/A',
      //     check_in: localIn,
      //     check_out: localOut,
      //     fecha: localIn ? localIn.split(' ')[0] : 'N/A',
      //     tipo: 'ASISTENCIA',
      //     estado: att.check_out ? 'Finalizado' : 'En curso',
      //   };
      // });

      // const resLogs = logs.map((log) => {
      //   const localTime = toLocal(log.punching_time);
      //   const esEntrada = log.status === '0' || log.status === '2';

      //   // 1. Extraemos el nombre del empleado del log
      //   const nombre = log.employee_id ? log.employee_id[1] : 'Desconocido';

      //   return {
      //     id: `log_${log.id}`,

      //     // 2. Asignamos el nombre y buscamos el documento en el mapa
      //     empleado: nombre,
      //     cc: partnerMap[nombre] || 'N/A', // <-- Aquí queda el doc_number para los logs

      //     department_id: log.x_studio_related_field_j40wn
      //       ? log.x_studio_related_field_j40wn[1]
      //       : 'SIN DEPTO',
      //     check_in: esEntrada ? localTime : null,
      //     check_out: !esEntrada ? localTime : null,
      //     c_entrada: esEntrada ? 'BIOMÉTRICO' : 'N/A',
      //     c_salida: !esEntrada ? 'BIOMÉTRICO' : 'N/A',
      //     fecha: localTime ? localTime.split(' ')[0] : 'N/A',
      //     tipo: 'LOG CRUDO',
      //     estado: 'Biométrico',
      //   };
      // });

      // --- 6. UNIÓN Y ORDENAMIENTO ---
      return [...resAttendances, ...resLogs].sort((a, b) => {
        const timeA = new Date(
          (a.check_in || a.check_out || '0').replace(' ', 'T'),
        ).getTime();
        const timeB = new Date(
          (b.check_in || b.check_out || '0').replace(' ', 'T'),
        ).getTime();
        return timeB - timeA;
      });
    } catch (error) {
      console.error('Error en reporte:', error);
      throw error;
    }
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
  // Método para que el Frontend consulte cómo va todo
  getProgress() {
    return this.syncProgress;
  }
  // usuarios.service.ts
  async previewSync(paisSeleccionado: string, deptoSeleccionado?: string) {
    const uid = await this.odoo.authenticate();
    const domain: any[] = [['company_id.name', '=', paisSeleccionado]];

    if (deptoSeleccionado && deptoSeleccionado !== 'TODOS') {
      domain.push(['department_id.name', '=', deptoSeleccionado]);
    }

    const odooEmployees = await this.odoo.executeKw<any[]>(
      'hr.employee',
      'search_read',
      [domain],
      {
        fields: [
          'id',
          'name',
          'identification_id',
          'job_title',
          'department_id',
        ],
      },
      uid,
    );

    // IDs de Odoo
    const odooIds = new Set(odooEmployees.map((e) => e.id));

    // Registros actuales en DB para ese país/depto
    const dbQuery = this.usuarioRepo
      .createQueryBuilder('u')
      .where('u.pais = :pais', { pais: paisSeleccionado });

    if (deptoSeleccionado && deptoSeleccionado !== 'TODOS') {
      dbQuery.andWhere('u.departamento = :depto', {
        departamento: deptoSeleccionado,
      });
    }

    const dbUsers = await dbQuery.getMany();
    const dbIds = new Set(dbUsers.map((u) => u.id_odoo));

    // Clasificar
    const toCreate = odooEmployees.filter((e) => !dbIds.has(e.id));
    const toUpdate = odooEmployees.filter((e) => dbIds.has(e.id));
    const toDelete = dbUsers.filter((u) => !odooIds.has(u.id_odoo));

    return {
      summary: {
        nuevos: toCreate.length,
        actualizados: toUpdate.length,
        aEliminar: toDelete.length,
      },
      toCreate: toCreate.map((e) => ({
        id_odoo: e.id,
        nombre: e.name,
        identificacion: e.identification_id,
      })),
      toUpdate: toUpdate.map((e) => ({
        id_odoo: e.id,
        nombre: e.name,
        identificacion: e.identification_id,
      })),
      toDelete: toDelete.map((u) => ({
        id: u.id,
        id_odoo: u.id_odoo,
        nombre: u.nombre,
        identificacion: u.identificacion,
      })),
    };
  }

  // Método para cancelar
  cancelSync() {
    this.syncProgress.isCancelled = true;
    this.syncProgress.status = 'cancelled';
  }
  async syncUsuariosFromOdoo(
    paisSeleccionado: string,
    deptoSeleccionado?: string,
  ) {
    try {
      // Reset de estado al iniciar
      this.syncProgress = {
        current: 0,
        total: 0,
        isCancelled: false,
        status: 'syncing',
      };

      const uid = await this.odoo.authenticate();
      const domain: any[] = [['company_id.name', '=', paisSeleccionado]];

      if (deptoSeleccionado && deptoSeleccionado !== 'TODOS') {
        domain.push(['department_id.name', '=', deptoSeleccionado]);
      }

      const odooEmployees = await this.odoo.executeKw<any[]>(
        'hr.employee',
        'search_read',
        [domain],
        {
          fields: [
            'id',
            'name',
            'identification_id',
            'job_title',
            'department_id',
          ],
        },
        uid,
      );

      // ── CALCULAR ELIMINADOS ANTES DEL LOOP ──────────────────────────────
      const odooIds = new Set(odooEmployees.map((e) => e.id));

      const dbQuery = this.usuarioRepo
        .createQueryBuilder('u')
        .where('u.pais = :pais', { pais: paisSeleccionado });

      if (deptoSeleccionado && deptoSeleccionado !== 'TODOS') {
        dbQuery.andWhere('u.departamento = :depto', {
          depto: deptoSeleccionado,
        });
      }

      const dbUsers = await dbQuery.getMany();
      const toDelete = dbUsers.filter((u) => !odooIds.has(u.id_odoo));
      // ────────────────────────────────────────────────────────────────────

      // Total = upserts + eliminaciones
      this.syncProgress.total = odooEmployees.length + toDelete.length;
      let nuevos = 0;
      let actualizados = 0;
      let eliminados = 0;

      // ── FASE 1: UPSERT ───────────────────────────────────────────────────
      for (const [index, emp] of odooEmployees.entries()) {
        if (this.syncProgress.isCancelled) {
          return {
            status: 'info',
            message: 'Sincronización cancelada por el usuario.',
          };
        }

        const existing = await this.usuarioRepo.findOne({
          where: { id_odoo: emp.id },
        });

        const data = {
          id_odoo: emp.id,
          nombre: emp.name,
          identificacion: emp.identification_id || 'N/A',
          cargo: emp.job_title || 'Sin Cargo',
          departamento: emp.department_id
            ? emp.department_id[1]
            : 'Sin Departamento',
          pais: paisSeleccionado,
        };

        if (!existing) {
          await this.usuarioRepo.save({ ...data, id: emp.id });
          nuevos++;
        } else {
          await this.usuarioRepo.update(existing.id, data);
          actualizados++;
        }

        this.syncProgress.current = index + 1;
      }

      // ── FASE 2: ELIMINAR HUÉRFANOS ───────────────────────────────────────
      for (const user of toDelete) {
        if (this.syncProgress.isCancelled) {
          return {
            status: 'info',
            message: `Sincronización cancelada. ${eliminados} eliminados hasta el momento.`,
          };
        }

        await this.usuarioRepo.delete(user.id);
        eliminados++;
        this.syncProgress.current = odooEmployees.length + eliminados;
      }
      // ────────────────────────────────────────────────────────────────────

      this.syncProgress.status = 'completed';
      return {
        status: 'success',
        message: `Sync (${deptoSeleccionado || 'General'}): ${nuevos} nuevos, ${actualizados} actualizados, ${eliminados} eliminados.`,
      };
    } catch (error) {
      this.syncProgress.status = 'error';
      console.error(`Error sincronizando ${paisSeleccionado}:`, error);
      throw new InternalServerErrorException(
        'Error al sincronizar empleados con Odoo',
      );
    }
  }

  async getOdooEmployeesRaw(paisSeleccionado?: string) {
    const uid = await this.odoo.authenticate();

    // 1. Forzamos el tipo a any[] para evitar el error de 'never'
    let domain: any[] = [];

    if (paisSeleccionado && paisSeleccionado !== 'TODOS') {
      // Odoo espera un array de arrays: [ ['campo', 'operador', 'valor'] ]
      domain = [['company_id.name', '=', paisSeleccionado]];
    }

    return await this.odoo.executeKw<any[]>(
      'hr.employee',
      'search_read',
      [domain], // <--- Odoo requiere que el domain vaya envuelto en otro array
      {
        fields: [
          'id',
          'name',
          'identification_id',
          'job_title',
          'department_id',
          'company_id',
        ],
      },
      uid,
    );
  }

  async findAllLocal(pais?: string) {
    const queryOptions: any = {
      relations: ['permisos'], // Lo ponemos aquí para que SIEMPRE los traiga
      order: { nombre: 'ASC' },
    };

    if (pais && pais !== 'TODOS') {
      queryOptions.where = { pais: pais };
    }

    return await this.usuarioRepo.find(queryOptions);
  }

  async removerModuloPermiso(idOdoo: number, modulo: string) {
    return await this.permisoRepo.delete({
      usuario_id_odoo: idOdoo,
      modulos: modulo,
    });
  }
  getApkInfo() {
    const fileExists = fs.existsSync(this.apkPath);
    const baseUrl =
      this.configService.get<string>('VITE_API_URL') || 'http://localhost:8082';

    let changelog = ['Mejoras de estabilidad'];
    if (fs.existsSync(this.jsonPath)) {
      try {
        changelog = JSON.parse(fs.readFileSync(this.jsonPath, 'utf8'));
      } catch (e) {
        console.error('Error al leer changelog.json');
      }
    }

    if (!fileExists) {
      return { exists: false, version: '0.0.0', downloadUrl: null };
    }

    const stats = fs.statSync(this.apkPath);

    return {
      exists: true,
      version: this.configService.get<string>('APP_VERSION') || '1.0.0',
      size: (stats.size / (1024 * 1024)).toFixed(2),
      lastUpdate: stats.mtime,
      downloadUrl: `${baseUrl}/usuarios/download-apk`, // Ruta para descargar
      changelog,
    };
  }

  async actualizarEstructuraLocal(idOdoo: number, campo: string, valor: any) {
    try {
      const usuario = await this.usuarioRepo.findOne({
        where: { id_odoo: idOdoo },
      });

      if (!usuario) {
        throw new NotFoundException(
          `Usuario con ID Odoo ${idOdoo} no encontrado`,
        );
      }

      // Al haber agregado las columnas en la entidad, esto ahora funcionará:
      usuario[campo] = valor === null ? null : valor;

      await this.usuarioRepo.save(usuario);

      return {
        status: 'success',
        message: `Asignación de ${campo} exitosa`,
      };
    } catch (error) {
      console.error('Error al actualizar estructura:', error);
      throw new InternalServerErrorException(
        'Error al guardar: ' + error.message,
      );
    }
  }
  async obtenerPerfilConEstructura(idOdoo: number) {
    // --- ESTE ES EL TEST DE DEPURACIÓN ---
    const todos = await this.usuarioRepo.find({ take: 5 });
    console.log('--- DEBUG DB ---');
    console.log('ID Odoo que busco:', idOdoo);
    console.log('Contenido actual de la tabla (5 primeros):', todos);
    // ------------------------------------

    const usuario = await this.usuarioRepo.findOne({
      where: [{ id_odoo: idOdoo }, { id: idOdoo }],
      relations: ['area', 'segmento', 'permisos'],
    });

    if (!usuario) {
      throw new NotFoundException(
        `Usuario ${idOdoo} no hallado en la tabla usuarios_registrados`,
      );
    }

    return usuario;
  }

  async getDeptosPermitidos(idOdoo: number): Promise<string[]> {
    const permisos = await this.permisoDeptRepo.find({
      where: { id_odoo: idOdoo },
    });
    return permisos.map((p) => p.departamento);
  }

  async setDeptosPermitidos(
    idOdoo: number,
    departamentos: string[],
  ): Promise<{ success: boolean }> {
    // Borra los anteriores y guarda los nuevos
    await this.permisoDeptRepo.delete({ id_odoo: idOdoo });
    if (departamentos.length) {
      const nuevos = departamentos.map((d) =>
        this.permisoDeptRepo.create({ id_odoo: idOdoo, departamento: d }),
      );
      await this.permisoDeptRepo.save(nuevos);
    }
    return { success: true };
  }

  async getResponsablePorArea(department: string, idOdoo: number) {
    // ─── 1. Busca el usuario específico por id_odoo ───────
    const usuario = await this.usuarioRepo.findOne({
      where: { id_odoo: idOdoo },
      relations: [
        'area',
        'area.responsable',
        'segmento',
        'segmento.responsable',
      ],
    });

    console.log('👤 Usuario:', usuario?.nombre);

    // ─── 2. Tiene área con responsable ───────────────────
    if (usuario?.area?.responsable) {
      console.log('✅ Responsable por área:', usuario.area.responsable.nombre);
      return {
        responsable_nombre: usuario.area.responsable.nombre,
        responsable_cargo: usuario.area.responsable.cargo,
        responsable_id_odoo: usuario.area.responsable.id_odoo,
        fuente: 'area',
      };
    }

    // ─── 3. Tiene segmento con responsable ───────────────
    if (usuario?.segmento?.responsable) {
      console.log(
        '✅ Responsable por segmento:',
        usuario.segmento.responsable.nombre,
      );
      return {
        responsable_nombre: usuario.segmento.responsable.nombre,
        responsable_cargo: usuario.segmento.responsable.cargo,
        responsable_id_odoo: usuario.segmento.responsable.id_odoo,
        fuente: 'segmento',
      };
    }

    // ─── 4. Fallback: consulta Odoo con this.odoo ────────
    console.warn('⚠️ Sin área ni segmento, consultando Odoo...');
    try {
      const uid = await this.odoo.authenticate();

      const employees = await this.odoo.executeKw<any[]>(
        'hr.employee',
        'search_read',
        [[['id', '=', idOdoo]]],
        { fields: ['name', 'coach_id', 'job_id'], limit: 1 },
        uid,
      );

      const empleado = employees?.[0];
      const jefeIdOdoo = empleado?.coach_id?.[0];
      const jefeNombreOdoo = empleado?.coach_id?.[1];

      console.log('🌐 Jefe id_odoo:', jefeIdOdoo, '| nombre:', jefeNombreOdoo);
      if (!jefeIdOdoo) return null;

      // ─── Intenta por id_odoo primero ─────────────────────
      let jefeDB = await this.usuarioRepo.findOne({
        where: { id_odoo: jefeIdOdoo },
      });

      // ─── Fallback: busca por nombre si no encontró ────────
      if (!jefeDB && jefeNombreOdoo) {
        const nombreNormalizado = jefeNombreOdoo
          .toUpperCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');

        jefeDB = await this.usuarioRepo
          .createQueryBuilder('u')
          .where('u.nombre LIKE :nombre', {
            nombre: `%${nombreNormalizado.split(' ')[0]}%`,
          })
          .getOne();

        console.log(
          '🔍 Búsqueda por nombre:',
          jefeDB?.nombre ?? 'No encontrado',
        );
      }

      return {
        responsable_nombre: jefeDB?.nombre ?? jefeNombreOdoo,
        responsable_cargo: jefeDB?.cargo ?? null,
        responsable_id_odoo: jefeDB?.id_odoo ?? jefeIdOdoo,
        fuente: 'odoo',
      };
    } catch (e) {
      console.error('❌ Error consultando Odoo:', e);
      return null;
    }
  }
}
