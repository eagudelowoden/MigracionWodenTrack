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
import { MailModule } from '../logsEmail/mail.module';
import { MailService } from '../logsEmail/mail.service';
import { MallaHoraria } from '../mallas/entities/malla-horaria.entity';
import { MallasLocalService } from '../mallas/mallas-local.service';
import { MallaAsignacion } from '../mallas/entities/malla-asignacion.entity';
import { MallaDetalle } from '../mallas/entities/malla-detalle.entity';

@Injectable()
export class UsuariosService {
  private syncProgress = {
    current: 0,
    total: 0,
    isCancelled: false,
    status: 'idle',
  };
  // Prevents duplicate markings from concurrent requests for the same employee
  private markingInProgress = new Set<number>();
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
    private readonly mailService: MailService,

    @InjectRepository(MallaAsignacion)
    private readonly asignacionRepo: Repository<MallaAsignacion>,

    @InjectRepository(Area)
    private readonly areaRepo: Repository<Area>,
    @InjectRepository(PermisoDepartamento)
    private readonly permisoDeptRepo: Repository<PermisoDepartamento>,
  ) { }

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
        fields: [
          'id',
          'name',
          'job_id',
          'department_id',
          'coach_id',
          'company_id',
        ], // 👈
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
      company: emp.company_id ? emp.company_id[1] : null, // 👈 AGREGAR ESTO
      isSuperAdmin: esSuperAdmin,
      day_completed: dayCompleted,
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
    // Race condition guard: reject concurrent markings for the same employee
    if (this.markingInProgress.has(employee_id)) {
      return {
        status: 'error',
        type: 'in_progress',
        message: 'Marcación en proceso, intente en un momento',
      };
    }
    this.markingInProgress.add(employee_id);

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
        // Colombia is UTC-5: Colombia midnight (00:00) = UTC 05:00
        // Using '05:00:00' avoids matching yesterday-evening UTC entries
        const registroHoy = await this.odoo.executeKw<any[]>(
          'hr.attendance',
          'search_read',
          [
            [
              ['employee_id', '=', employee_id],
              ['check_in', '>=', `${hoyFechaCorta} 05:00:00`],
              ['check_out', '!=', false],
            ],
          ],
          {
            fields: ['id', 'check_in', 'check_out'],
            limit: 1,
            order: 'check_in desc',
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
          // Colombia 23:59:59 of checkInLocal day = UTC next-day 04:59:59
          const nextDay = new Date(new Date(checkInLocal).getTime() + 86_400_000)
            .toISOString()
            .split('T')[0];
          const cierreCompensado = `${nextDay} 04:59:59`;

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
    } finally {
      this.markingInProgress.delete(employee_id);
    }
  }

  async getAllMallas(
    companyName?: string,
    departamentoName?: string,
    areaId?: number,
    segmentoId?: number,
  ) {
    const hoy = new Date().toISOString().slice(0, 10);
    const now = new Date();
    const dayOfWeekOdoo = now.getDay() === 0 ? 6 : now.getDay() - 1;

    // 1. Traer usuarios activos de DB local con filtros
    const usuarioQuery = this.usuarioRepo
      .createQueryBuilder('u')
      .where('u.is_active = :active', { active: true });

    if (
      departamentoName &&
      departamentoName.trim() !== '' &&
      departamentoName !== 'Todas'
    ) {
      usuarioQuery.andWhere('u.departamento LIKE :depto', {
        depto: `%${departamentoName}%`,
      });
    }
    if (areaId) {
      usuarioQuery.andWhere('u.area_id = :areaId', { areaId });
    }
    if (segmentoId) {
      usuarioQuery.andWhere('u.segmento_id = :segmentoId', { segmentoId });
    }

    const usuarios = await usuarioQuery
      .select(['u.id_odoo', 'u.nombre', 'u.cargo', 'u.departamento'])
      .orderBy('u.nombre', 'ASC')
      .getMany();

    if (!usuarios.length) return [];

    const idOdoos = usuarios.map((u) => u.id_odoo).filter(Boolean);
    if (!idOdoos.length) return [];

    // 2. Obtener asignaciones vigentes con malla y detalles
    const asignaciones = await this.asignacionRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.malla', 'malla')
      .leftJoinAndSelect('malla.detalles', 'detalles')
      .where('a.usuario_id_odoo IN (:...ids)', { ids: idOdoos })
      .andWhere('a.actual = 1')
      .getMany();

    // 3. Mapa id_odoo → asignacion vigente
    const mallaLocalPorEmpleado = new Map<number, any>();
    for (const asig of asignaciones) {
      if (!mallaLocalPorEmpleado.has(asig.usuario_id_odoo)) {
        mallaLocalPorEmpleado.set(asig.usuario_id_odoo, asig);
      }
    }

    // 4. Construir resultado
    return usuarios.map((u) => {
      const asigLocal = mallaLocalPorEmpleado.get(u.id_odoo);
      let horario = 'No programado';
      let jornada = 'N/A';
      let nombreMalla = 'Sin Malla';

      if (asigLocal?.malla) {
        nombreMalla = asigLocal.malla.nombre;
        if (asigLocal.malla.detalles?.length) {
          const detalleHoy = asigLocal.malla.detalles
            .filter((d: any) => d.dia_semana === dayOfWeekOdoo)
            .sort((a: any, b: any) => a.hora_inicio - b.hora_inicio)[0];

          if (detalleHoy) {
            horario = `${this.formatDecimal(detalleHoy.hora_inicio)} - ${this.formatDecimal(detalleHoy.hora_fin)}`;
            jornada =
              detalleHoy.periodo === 'morning'
                ? 'Diurna'
                : detalleHoy.periodo === 'afternoon'
                  ? 'Tarde'
                  : 'Nocturna';
          }
        }
      }

      return {
        nombre: u.nombre,
        departamento: u.departamento || 'No asignado',
        malla: nombreMalla,
        cargo: u.cargo || 'No asignado',
        jornada,
        horario,
      };
    });
  }

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

  /**
   * Trae TODO el historial de asignaciones de malla para los empleados dados.
   * Retorna Map<idOdoo, MallaAsignacion[]> ordenado por fecha_inicio DESC
   * para que resolverDetallesParaFecha encuentre la vigente primero.
   */
  private async getMallasMapLocal(
    employeeIds: number[],
  ): Promise<Map<number, any[]>> {
    if (!employeeIds.length) return new Map();

    const asignaciones = await this.asignacionRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.malla', 'malla')
      .leftJoinAndSelect('malla.detalles', 'detalles')
      .where('a.usuario_id_odoo IN (:...ids)', { ids: employeeIds })
      .orderBy('a.fecha_inicio', 'DESC')
      .getMany();

    const mallaMap = new Map<number, any[]>();
    for (const asig of asignaciones) {
      const lista = mallaMap.get(asig.usuario_id_odoo) ?? [];
      lista.push(asig);
      mallaMap.set(asig.usuario_id_odoo, lista);
    }
    return mallaMap;
  }

  /**
   * Dado el historial de asignaciones de un empleado y una fecha YYYY-MM-DD (Colombia),
   * devuelve los detalles (días/horas) de la malla que estaba vigente ese día.
   * Lógica: fecha_inicio <= fecha AND (fecha_fin IS NULL OR fecha_fin >= fecha)
   * Fallback: la asignación más reciente anterior a la fecha (para cubrir gaps).
   */
  private resolverDetallesParaFecha(asignaciones: any[], fechaLocal: string): any[] {
    if (!asignaciones?.length) return [];

    // Buscar la asignación cuyo rango cubre la fecha
    const vigente = asignaciones.find((a) => {
      const inicio = String(a.fecha_inicio).slice(0, 10);
      const fin = a.fecha_fin ? String(a.fecha_fin).slice(0, 10) : null;
      return inicio <= fechaLocal && (fin === null || fin >= fechaLocal);
    });

    if (vigente?.malla?.detalles?.length) return vigente.malla.detalles;

    // Fallback: asignación más reciente anterior a la fecha (lista ya viene DESC)
    const anterior = asignaciones.find(
      (a) => String(a.fecha_inicio).slice(0, 10) <= fechaLocal,
    );
    return anterior?.malla?.detalles ?? [];
  }

  private clasificarPorMallaLocal(
    empId: number,
    punchingTime: string,
    esEntrada: boolean,
    mallasLocalMap: Map<number, any[]>, // Map<idOdoo, MallaAsignacion[]>
    diaSemanaOverride?: number,         // día de la ENTRADA — fijo para validar salida también
  ): string {
    const asignaciones = mallasLocalMap.get(empId);
    if (!asignaciones?.length) return 'No programado';

    // Convertir punch a hora Colombia
    const fechaUTC = new Date(punchingTime.replace(' ', 'T') + 'Z');
    const horaLocal = new Date(
      fechaUTC.toLocaleString('en-US', { timeZone: 'America/Bogota' }),
    );

    // Fecha Colombia del punch (YYYY-MM-DD) para buscar malla vigente ese día
    const fechaLocalStr = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(fechaUTC);

    // Resolver detalles según el historial de asignaciones para esa fecha
    const detalles = this.resolverDetallesParaFecha(asignaciones, fechaLocalStr);
    if (!detalles?.length) return 'No programado';

    const diaSemana = diaSemanaOverride !== undefined
      ? diaSemanaOverride
      : (horaLocal.getDay() === 0 ? 6 : horaLocal.getDay() - 1);
    const diaSemanaAnterior = diaSemana === 0 ? 6 : diaSemana - 1;
    const horaDecimal = horaLocal.getHours() + horaLocal.getMinutes() / 60;
    const tolerancia = 6 / 60;

    // Buscar turno del día
    const detallesDia = detalles
      .filter((d: any) => Number(d.dia_semana) === diaSemana)
      .sort((a: any, b: any) => Number(a.hora_inicio) - Number(b.hora_inicio));

    if (detallesDia.length) {
      const turno = detallesDia[0];
      const horaInicio = Number(turno.hora_inicio);
      const horaFin = Number(turno.hora_fin);

      if (esEntrada) {
        return horaDecimal > horaInicio + tolerancia ? 'ENTRADA TARDE' : 'A TIEMPO';
      } else {
        return horaDecimal < horaFin ? 'SALIDA ANTICIPADA' : 'A TIEMPO';
      }
    }

    // No hay turno hoy — verificar si es salida de turno nocturno del día anterior
    const turnosNocturnos = detalles.filter(
      (d: any) =>
        Number(d.dia_semana) === diaSemanaAnterior &&
        Number(d.hora_fin) < Number(d.hora_inicio),
    );

    if (turnosNocturnos.length) {
      const turnoNoche = turnosNocturnos.sort(
        (a: any, b: any) => Number(a.hora_inicio) - Number(b.hora_inicio),
      )[0];
      const horaFinNoche = Number(turnoNoche.hora_fin);

      if (horaDecimal <= horaFinNoche) {
        if (!esEntrada) {
          return horaDecimal < horaFinNoche ? 'SALIDA ANTICIPADA' : 'A TIEMPO';
        }
        return 'A TIEMPO';
      }
    }

    return 'No programado';
  }

  private mapAttendances(
    attendances: any[],
    partnerMap: Record<string, string>,
    toLocal: (d: string) => string | null,
    mallasLocalMap: Map<number, any[]>,
  ): any[] {
    // Agrupar por empleado + día (un solo registro por persona por día)
    const grupos: Record<
      string,
      { empId: number; nombre: string; dept: string; registros: any[] }
    > = {};

    for (const att of attendances) {
      const empId = att.employee_id?.[0];
      const nombre = att.employee_id?.[1] || 'Desconocido';
      const localIn = toLocal(att.check_in);
      const fecha = localIn ? localIn.split(' ')[0] : 'SIN_FECHA';
      const key = `${empId}_${fecha}`;

      if (!grupos[key]) {
        grupos[key] = {
          empId,
          nombre,
          dept: att.department_id ? att.department_id[1] : 'SIN DEPTO',
          registros: [],
        };
      }
      grupos[key].registros.push(att);
    }

    return Object.values(grupos).map(({ empId, nombre, dept, registros }) => {
      // Ordenar por check_in para tomar el primero (entrada real del día)
      const ordenados = registros.sort(
        (a, b) =>
          new Date(a.check_in).getTime() - new Date(b.check_in).getTime(),
      );

      const primero = ordenados[0];

      // La salida es el check_out MÁS TARDÍO, ignorando cierres automáticos de Odoo
      // (registros donde check_out - check_in < 60 s → worked_hours ≈ 0)
      const conSalida = registros.filter((r) => {
        if (!r.check_out) return false;
        const diffMs = new Date(r.check_out).getTime() - new Date(r.check_in).getTime();
        return diffMs >= 60_000; // descartar cierres automáticos (< 1 minuto)
      });
      const ultimoConSalida = conSalida.length
        ? conSalida.reduce((best, cur) =>
            new Date(cur.check_out) > new Date(best.check_out) ? cur : best,
          )
        : null;

      const localIn = toLocal(primero.check_in);
      const localOut = ultimoConSalida ? toLocal(ultimoConSalida.check_out) : null;
      const fecha = localIn ? localIn.split(' ')[0] : 'N/A';

      // Calcular diaSemana desde la ENTRADA (Colombia) para usar en ambas validaciones
      const fechaEntradaUTC = new Date(primero.check_in.replace(' ', 'T') + 'Z');
      const horaEntradaLocal = new Date(
        fechaEntradaUTC.toLocaleString('en-US', { timeZone: 'America/Bogota' }),
      );
      const diaSemanaEntrada = horaEntradaLocal.getDay() === 0 ? 6 : horaEntradaLocal.getDay() - 1;

      // Prioridad: usar el estado que ya calculó Odoo en tiempo real (x_studio_tipo_entrada/salida)
      // Si no está disponible, clasificar contra la malla local
      const odooEntrada = primero.x_studio_tipo_entrada;
      const odooSalida  = ultimoConSalida?.x_studio_tipo_salida;

      const cEntrada = (odooEntrada && odooEntrada !== false)
        ? odooEntrada
        : empId && primero.check_in
          ? this.clasificarPorMallaLocal(empId, primero.check_in, true, mallasLocalMap, diaSemanaEntrada)
          : 'No programado';

      const cSalida = ultimoConSalida
        ? (odooSalida && odooSalida !== false)
          ? odooSalida
          : empId
            ? this.clasificarPorMallaLocal(empId, ultimoConSalida.check_out, false, mallasLocalMap, diaSemanaEntrada)
            : 'N/A'
        : 'N/A';

      return {
        id: `att_${primero.id}`,
        empleado: nombre,
        cc: partnerMap[nombre] || 'N/A',
        department_id: dept,
        c_entrada: cEntrada,
        c_salida: cSalida,
        check_in: localIn,
        check_out: localOut,
        fecha,
        tipo: 'ASISTENCIA',
        fuente: 'APLICATIVO',
        estado: localOut ? 'Finalizado' : 'En curso',
      };
    });
  }

  private async mapLogs(
    logs: any[],
    partnerMap: Record<string, string>,
    toLocal: (d: string) => string | null,
    uid: number,
    agruparLogs: boolean = true,
    mallasLocalMap: Map<number, any[]> = new Map(),
  ): Promise<any[]> {

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

    // --- UNA FILA POR EMPLEADO POR DÍA: MIN = entrada, MAX = salida ---
    return Object.values(grupos).map(({ empId, nombre, dept, registros }) => {
      const ordenados = registros.sort(
        (a, b) =>
          new Date(a.punching_time).getTime() -
          new Date(b.punching_time).getTime(),
      );

      const primero = ordenados[0];                              // MIN → ENTRADA
      const ultimo  = ordenados[ordenados.length - 1];           // MAX → SALIDA
      // Hay salida real solo si el último punch es al menos 60 s después del primero
      const diffPunchesMs = new Date(ultimo.punching_time).getTime() - new Date(primero.punching_time).getTime();
      const haySalida = ordenados.length > 1 && diffPunchesMs >= 60_000;

      // diaSemana derivado de la ENTRADA (Colombia) — fijo para validar ambos extremos
      const fechaPrimeroUTC = new Date(primero.punching_time.replace(' ', 'T') + 'Z');
      const horaLocalPrimero = new Date(
        fechaPrimeroUTC.toLocaleString('en-US', { timeZone: 'America/Bogota' }),
      );
      const diaSemanaEntrada = horaLocalPrimero.getDay() === 0 ? 6 : horaLocalPrimero.getDay() - 1;

      const localIn  = toLocal(primero.punching_time);
      const localOut = haySalida ? toLocal(ultimo.punching_time) : null;
      const fecha    = localIn ? localIn.split(' ')[0] : 'N/A';

      const cEntrada = empId
        ? this.clasificarPorMallaLocal(empId, primero.punching_time, true, mallasLocalMap, diaSemanaEntrada)
        : 'No programado';

      const cSalida = haySalida && empId
        ? this.clasificarPorMallaLocal(empId, ultimo.punching_time, false, mallasLocalMap, diaSemanaEntrada)
        : 'N/A';

      const estado = haySalida ? 'Finalizado' : 'En curso';

      return {
        id: `log_${empId}_${fecha}`,
        empleado: nombre,
        cc: partnerMap[nombre] || 'N/A',
        department_id: dept,
        check_in: localIn,
        check_out: localOut,
        c_entrada: cEntrada,
        c_salida: cSalida,
        fecha,
        tipo: 'LOG CRUDO',
        fuente: 'BIOMÉTRICO',
        estado,
      };
    });
  }
  // ==========================================
  // MÉTODO PRINCIPAL - Solo orquesta
  // ==========================================
  async getReporteNovedades(
    soloHoy?: boolean,
    companyName?: string,
    startDate?: string,
    endDate?: string,
    departamentoName?: string,
    areaId?: number,
    segmentoId?: number,
    agruparLogs: boolean = true, // 👈 NUEVO
  ) {
    console.time('⏱ TOTAL reporte');
    const inicioTotal = Date.now();
    const uid = await this.odoo.authenticate();
    const { hoyFechaCorta } = getFechaColombia();

    const rangoTexto = soloHoy
      ? 'Hoy'
      : `${startDate || '?'} → ${endDate || '?'}`;
    const deptoTexto = departamentoName || 'Todos los departamentos';

    // 1. Filtro por estructura local (área/segmento)
    const employeeIdsPorEstructura = await this.resolverIdsPorEstructura(
      areaId,
      segmentoId,
    );
    if (
      employeeIdsPorEstructura !== null &&
      employeeIdsPorEstructura.length === 0
    )
      return [];

    // 2. Calcular fechas UTC
    const { inicioUTC, finUTC } = this.calcularRangoUTC(
      soloHoy,
      hoyFechaCorta,
      startDate,
      endDate,
    );

    // 3. Construir dominios
    const { domainAtt, domainLog } = this.construirDominios(
      inicioUTC,
      finUTC,
      companyName,
      departamentoName,
      employeeIdsPorEstructura,
    );

    // 4. Consultar Odoo
    console.time('⏱ query-odoo');
    let attendances: any[];
    let logs: any[];

    try {
      [attendances, logs] = await this.consultarOdoo(domainAtt, domainLog, uid);
    } catch (error) {
      // Enviar correo si la consulta falla (ej: demasiados registros)
      this.mailService
        .enviarAlertaConsulta({
          tipo: 'error',
          departamento: deptoTexto,
          rango: rangoTexto,
          mensaje: error.message,
        })
        .catch((e) => console.error('Error enviando alerta correo:', e));
      throw error;
    }

    console.timeEnd('⏱ query-odoo');
    const total = attendances.length + logs.length;
    console.log(`📊 Attendances: ${attendances.length} | Logs: ${logs.length}`);

    // Alerta si la consulta trajo muchos registros
    if (total > 15000) {
      this.mailService
        .enviarAlertaConsulta({
          tipo: 'grande',
          registros: total,
          departamento: deptoTexto,
          rango: rangoTexto,
          mensaje:
            'La consulta fue exitosa pero es muy pesada. Considera agregar más filtros.',
        })
        .catch((e) => console.error('Error enviando alerta correo:', e));
    }

    // 5. Obtener cédulas
    console.time('⏱ partners');
    const partnerMap = await this.obtenerPartnerMap(attendances, logs, uid);
    console.timeEnd('⏱ partners');

    // 6. Mapear resultados
    const toLocal = this.crearConvertidorLocal();

    // Construir malla local para TODOS los empleados (attendance + logs)
    const todosLosEmpIds = [
      ...new Set([
        ...attendances.map((a) => a.employee_id?.[0]).filter(Boolean),
        ...logs.map((l) => l.employee_id?.[0]).filter(Boolean),
      ]),
    ];
    const mallasLocalMap = await this.getMallasMapLocal(todosLosEmpIds);

    console.time('⏱ mapLogs');
    const [resAttendances, resLogs] = await Promise.all([
      Promise.resolve(this.mapAttendances(attendances, partnerMap, toLocal, mallasLocalMap)),
      this.mapLogs(logs, partnerMap, toLocal, uid, agruparLogs, mallasLocalMap),
    ]);
    console.timeEnd('⏱ mapLogs');

    // 7. Unir y ordenar
    const resultado = [...resAttendances, ...resLogs].sort((a, b) => {
      const timeA = new Date(
        (a.check_in || a.check_out || '0').replace(' ', 'T'),
      ).getTime();
      const timeB = new Date(
        (b.check_in || b.check_out || '0').replace(' ', 'T'),
      ).getTime();
      return timeB - timeA;
    });

    const tiempoTotal = (Date.now() - inicioTotal) / 1000;
    console.timeEnd('⏱ TOTAL reporte');
    console.log(`✅ Total registros devueltos: ${resultado.length}`);

    // Correo si tardó más de 20 segundos
    if (tiempoTotal > 60) {
      this.mailService
        .enviarAlertaConsulta({
          tipo: 'grande',
          registros: resultado.length,
          tiempo: tiempoTotal,
          departamento: deptoTexto,
          rango: rangoTexto,
          mensaje: `La consulta tardó ${tiempoTotal.toFixed(1)}s. Rendimiento degradado.`,
        })
        .catch((e) => console.error('Error enviando alerta correo:', e));
    }

    return resultado;
  }

  // ==========================================
  // MÉTODOS AUXILIARES DEL REPORTE
  // ==========================================

  private async resolverIdsPorEstructura(
    areaId?: number,
    segmentoId?: number,
  ): Promise<number[] | null> {
    if (!areaId && !segmentoId) return null;

    const where: any = {};
    if (areaId) where.area_id = areaId;
    if (segmentoId) where.segmento_id = segmentoId;

    const usuarios = await this.usuarioRepo.find({
      where,
      select: ['id_odoo'],
    });
    return usuarios.map((u) => u.id_odoo).filter((id) => id != null);
  }

  private calcularRangoUTC(
    soloHoy: boolean | undefined,
    hoyFechaCorta: string,
    startDate?: string,
    endDate?: string,
  ): { inicioUTC: string | null; finUTC: string | null } {
    const startDay = soloHoy ? hoyFechaCorta : startDate;
    const endDay = soloHoy ? hoyFechaCorta : endDate;
    const inicioUTC = startDay ? `${startDay} 05:00:00` : null;

    let finUTC: string | null = null;
    if (endDay) {
      const [anio, mes, dia] = endDay.split('-').map(Number);
      const fechaFin = new Date(anio, mes - 1, dia);
      fechaFin.setDate(fechaFin.getDate() + 1);

      const a = fechaFin.getFullYear();
      const m = String(fechaFin.getMonth() + 1).padStart(2, '0');
      const d = String(fechaFin.getDate()).padStart(2, '0');
      finUTC = `${a}-${m}-${d} 04:59:59`;
    }

    return { inicioUTC, finUTC };
  }

  private construirDominios(
    inicioUTC: string | null,
    finUTC: string | null,
    companyName?: string,
    departamentoName?: string,
    employeeIds?: number[] | null,
  ): { domainAtt: any[]; domainLog: any[] } {
    const domainAtt: any[] = [];
    const domainLog: any[] = [];

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
    if (
      departamentoName &&
      departamentoName !== 'DEPARTAMENTOS' &&
      departamentoName !== ''
    ) {
      domainAtt.push([
        'employee_id.department_id.name',
        'ilike',
        departamentoName,
      ]);
      domainLog.push([
        'x_studio_related_field_j40wn.name',
        'ilike',
        departamentoName,
      ]);
    }
    if (employeeIds && employeeIds.length > 0) {
      domainAtt.push(['employee_id', 'in', employeeIds]);
      domainLog.push(['employee_id', 'in', employeeIds]);
    }

    return { domainAtt, domainLog };
  }

  private async consultarOdoo(
    domainAtt: any[],
    domainLog: any[],
    uid: number,
  ): Promise<[any[], any[]]> {
    return Promise.all([
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
          limit: 30000000,
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
          limit: 30000000,
        },
        uid,
      ),
    ]);
  }

  private async obtenerPartnerMap(
    attendances: any[],
    logs: any[],
    uid: number,
  ): Promise<Record<string, string>> {
    // 1. Obtener IDs únicos de empleados
    const employeeIds = [
      ...new Set([
        ...attendances.map((a) => a.employee_id?.[0]),
        ...logs.map((l) => l.employee_id?.[0]),
      ]),
    ].filter(Boolean) as number[];

    if (employeeIds.length === 0) return {};

    // 2. Buscar empleados por ID — más confiable que por nombre
    const empleados = await this.odoo.executeKw<any[]>(
      'hr.employee',
      'search_read',
      [[['id', 'in', employeeIds]]],
      {
        fields: [
          'id',
          'name',
          'identification_id',
          'barcode',
          'address_home_id',
        ],
      },
      uid,
    );

    const partnerMap: Record<string, string> = {};
    const sinCedula: any[] = [];

    // 3. Primero intentar con identification_id o barcode directo
    empleados.forEach((e) => {
      const cedula = e.identification_id || e.barcode;
      if (cedula && cedula.trim() !== '') {
        partnerMap[e.name] = cedula;
      } else {
        sinCedula.push(e);
      }
    });

    // 4. Para los que no tienen, buscar en res.partner por address_home_id
    const partnerIds = sinCedula
      .map((e) => e.address_home_id?.[0])
      .filter(Boolean) as number[];

    if (partnerIds.length > 0) {
      const partners = await this.odoo.executeKw<any[]>(
        'res.partner',
        'search_read',
        [[['id', 'in', [...new Set(partnerIds)]]]],
        { fields: ['id', 'doc_number'] },
        uid,
      );

      const docPorPartnerId = new Map(
        partners.map((p) => [p.id, p.doc_number]),
      );

      sinCedula.forEach((e) => {
        const partnerId = e.address_home_id?.[0];
        if (partnerId) {
          const doc = docPorPartnerId.get(partnerId);
          if (doc && doc.trim() !== '' && doc !== 'false') {
            partnerMap[e.name] = doc;
          }
        }
      });
    }

    console.log(
      `✅ Cédulas resueltas: ${Object.keys(partnerMap).length} / ${empleados.length}`,
    );
    return partnerMap;
  }

  private crearConvertidorLocal(): (utcDate: string) => string | null {
    return (utcDate: string) => {
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

        if (existing) {
          // Ya existe en la DB → no tocar nada
          this.syncProgress.current = index + 1;
          continue;
        }

        // Solo insertar si es completamente nuevo
        await this.usuarioRepo.save({
          id_odoo: emp.id,
          nombre: emp.name,
          identificacion: emp.identification_id || 'N/A',
          cargo: emp.job_title || 'Sin Cargo',
          departamento: emp.department_id ? emp.department_id[1] : 'Sin Departamento',
          pais: paisSeleccionado,
        });
        nuevos++;

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
        message: `Sync (${deptoSeleccionado || 'General'}): ${nuevos} nuevos insertados, ${eliminados} eliminados.`,
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

  async removerModuloPermiso(idOdoo: number, modulo: string, adminName?: string) {
    console.log(`[PERMISO REMOVIDO] módulo "${modulo}" de usuario ${idOdoo} por: ${adminName ?? 'Desconocido'}`);
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

  async actualizarEstructuraLocal(idOdoo: number, campo: string, valor: any, adminName?: string) {
    try {
      const usuario = await this.usuarioRepo.findOne({
        where: { id_odoo: idOdoo },
      });

      if (!usuario) {
        throw new NotFoundException(
          `Usuario con ID Odoo ${idOdoo} no encontrado`,
        );
      }

      usuario[campo] = valor === null ? null : valor;

      await this.usuarioRepo.save(usuario);

      console.log(`[ESTRUCTURA] ${campo} de usuario ${idOdoo} actualizado por: ${adminName ?? 'Desconocido'}`);

      return {
        status: 'success',
        message: `Asignación de ${campo} exitosa`,
        modificado_por: adminName ?? null,
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
    adminName?: string,
  ): Promise<{ success: boolean }> {
    await this.permisoDeptRepo.delete({ id_odoo: idOdoo });
    if (departamentos.length) {
      const nuevos = departamentos.map((d) =>
        this.permisoDeptRepo.create({
          id_odoo: idOdoo,
          departamento: d,
          asignado_por: adminName ?? null,
        }),
      );
      await this.permisoDeptRepo.save(nuevos);
    }
    console.log(`[DEPTOS] departamentos de usuario ${idOdoo} actualizados por: ${adminName ?? 'Desconocido'}`);
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
