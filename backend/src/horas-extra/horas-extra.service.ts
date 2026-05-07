import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HoraExtra } from './entities/hora-extra.entity';
import { HoraExtraCargue } from './entities/hora-extra-cargue.entity';
import { MallaAsignacion } from '../mallas/entities/malla-asignacion.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { OdooService } from '../odoo/odoo.service';
import * as ExcelJS from 'exceljs';

function getFechaColombiaHoy(): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export interface CalcularExtrasDto {
  startDate?: string;
  endDate?: string;
  soloHoy?: boolean;
  company?: string;
  calculado_por?: string;
  guardar?: boolean;
  area_id?: number;
  segmento_id?: number;
  registros?: { cedula: string; fecha: string; aprobado: boolean | null }[];
}

// Minutos que se solapan entre [s1,e1] y [s2,e2]
function overlap(s1: number, e1: number, s2: number, e2: number): number {
  return Math.max(0, Math.min(e1, e2) - Math.max(s1, s2));
}

// Minutos nocturnos en el rango [start, end] (21:00-06:00 = 1260-1440 y 0-360)
function minsNocturno(start: number, end: number): number {
  if (end <= start) return 0;
  return overlap(start, end, 1260, 1440) + overlap(start, end, 0, 360);
}

// Minutos diurnos en el rango [start, end] (06:00-21:00 = 360-1260)
function minsDiurno(start: number, end: number): number {
  if (end <= start) return 0;
  return overlap(start, end, 360, 1260);
}

// Minutos → horas sexagesimales redondeadas a 2 decimales (60→1.0, 30→0.50)
function toHex(minutes: number): number {
  return Math.round((minutes / 60) * 100) / 100;
}

@Injectable()
export class HorasExtraService {
  constructor(
    @InjectRepository(HoraExtra)
    private readonly horaExtraRepo: Repository<HoraExtra>,
    @InjectRepository(HoraExtraCargue)
    private readonly cargueRepo: Repository<HoraExtraCargue>,
    @InjectRepository(MallaAsignacion)
    private readonly asignacionRepo: Repository<MallaAsignacion>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    private readonly odoo: OdooService,
  ) {}

  private async resolverIdsPorEstructura(
    areaId?: number,
    segmentoId?: number,
  ): Promise<number[] | null> {
    if (!areaId && !segmentoId) return null;

    // OR entre area y segmento: un empleado que coincida con cualquiera de los
    // dos criterios es válido. Usar AND excluía empleados que solo tenían uno.
    const conditions: any[] = [];
    if (areaId) conditions.push({ area_id: areaId });
    if (segmentoId) conditions.push({ segmento_id: segmentoId });

    const usuarios = await this.usuarioRepo.find({
      where: conditions,
      select: ['id_odoo'],
    });

    const ids = [...new Set(
      usuarios.map((u) => u.id_odoo).filter((id) => id != null),
    )];
    return ids;
  }

  private toLocal(utcDate: string): string | null {
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
  }

  private decimalToHora(decimal: number): string {
    const h = Math.floor(decimal);
    const m = Math.round((decimal - h) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  private parseMinutos(datetimeStr: string): number {
    const timePart = datetimeStr.includes(' ')
      ? datetimeStr.split(' ')[1]
      : datetimeStr;
    const [h, m, s] = timePart.split(':').map(Number);
    return h * 60 + m + (s || 0) / 60;
  }

  private async getMallasMap(
    employeeIds: number[],
  ): Promise<Map<number, any[]>> {
    if (!employeeIds.length) return new Map();

    const CHUNK = 500;
    const map = new Map<number, any[]>();

    for (let i = 0; i < employeeIds.length; i += CHUNK) {
      const lote = employeeIds.slice(i, i + CHUNK);

      const asignaciones = await this.asignacionRepo
        .createQueryBuilder('a')
        .leftJoinAndSelect('a.malla', 'malla')
        .leftJoinAndSelect('malla.detalles', 'detalles')
        .where('a.usuario_id_odoo IN (:...ids)', { ids: lote })
        .orderBy('a.fecha_inicio', 'DESC')
        .getMany();

      for (const a of asignaciones) {
        const list = map.get(a.usuario_id_odoo) ?? [];
        list.push(a);
        map.set(a.usuario_id_odoo, list);
      }
    }

    return map;
  }

  private resolverDetallesParaFecha(asignaciones: any[], fecha: string): any[] {
    if (!asignaciones?.length) return [];

    const toStr = (v: any): string => {
      if (!v) return '';
      if (v instanceof Date) return v.toISOString().slice(0, 10);
      return String(v).slice(0, 10);
    };

    const vigente = asignaciones.find((a) => {
      const inicio = toStr(a.fecha_inicio);
      const fin = a.fecha_fin ? toStr(a.fecha_fin) : null;
      return inicio <= fecha && (fin === null || fin >= fecha);
    });

    if (vigente?.malla?.detalles?.length) return vigente.malla.detalles;

    const anterior = asignaciones.find((a) => toStr(a.fecha_inicio) <= fecha);
    return anterior?.malla?.detalles ?? [];
  }

  private getDiaSemana(fechaYYYYMMDD: string): number {
    const [a, m, d] = fechaYYYYMMDD.split('-').map(Number);
    const js = new Date(a, m - 1, d).getDay();
    return js === 0 ? 6 : js - 1; // 0=Lun...6=Dom
  }

  // Tolerancia de 6 minutos para ignorar marcaciones mínimas
  private static readonly TOLERANCIA_MINS = 6;

  private calcularCategorias(
    localIn: string | null,
    localOut: string | null,
    turno: any | null,
    esFestivo: boolean,
  ): Pick<
    HoraExtra,
    'rn' | 'rndf' | 'rddf' | 'hedo' | 'heno' | 'hefd' | 'hefn'
  > {
    const result = {
      rn: 0,
      rndf: 0,
      rddf: 0,
      hedo: 0,
      heno: 0,
      hefd: 0,
      hefn: 0,
    };

    if (!localIn || !localOut) return result;

    const inMins = this.parseMinutos(localIn);
    const outMins = this.parseMinutos(localOut);
    if (outMins <= inMins) return result; // Salida antes de entrada → ignorar

    const TOLERANCIA = HorasExtraService.TOLERANCIA_MINS;

    if (esFestivo) {
      if (turno) {
        // Horas DENTRO del turno en festivo
        const shiftStart = Number(turno.hora_inicio) * 60;
        const shiftEnd = Number(turno.hora_fin) * 60;
        const dentroStart = Math.max(inMins, shiftStart);
        const dentroEnd = Math.min(outMins, shiftEnd);

        if (dentroEnd > dentroStart) {
          result.rddf = toHex(minsDiurno(dentroStart, dentroEnd));
          result.rndf = toHex(minsNocturno(dentroStart, dentroEnd));
        }

        // Extra ANTES del turno
        if (inMins < shiftStart - TOLERANCIA) {
          const extraEnd = Math.min(outMins, shiftStart);
          result.hefd += toHex(minsDiurno(inMins, extraEnd));
          result.hefn += toHex(minsNocturno(inMins, extraEnd));
        }

        // Extra DESPUÉS del turno
        if (outMins > shiftEnd + TOLERANCIA) {
          const extraStart = Math.max(inMins, shiftEnd);
          result.hefd += toHex(minsDiurno(extraStart, outMins));
          result.hefn += toHex(minsNocturno(extraStart, outMins));
        }
      } else {
        // Domingo sin malla: todas las horas son festivas
        result.hefd = toHex(minsDiurno(inMins, outMins));
        result.hefn = toHex(minsNocturno(inMins, outMins));
      }
    } else {
      // Día ordinario sin malla → todas las horas son extra
      if (!turno) {
        result.hedo = toHex(minsDiurno(inMins, outMins));
        result.heno = toHex(minsNocturno(inMins, outMins));
        result.hedo = Math.round(result.hedo * 100) / 100;
        result.heno = Math.round(result.heno * 100) / 100;
        return result;
      }

      const shiftStart = Number(turno.hora_inicio) * 60;
      const shiftEnd = Number(turno.hora_fin) * 60;

      // Recargo nocturno dentro del turno (horas del turno que caen en noche)
      result.rn = toHex(minsNocturno(shiftStart, shiftEnd));

      // Extra ANTES del turno
      if (inMins < shiftStart - TOLERANCIA) {
        const extraEnd = Math.min(outMins, shiftStart);
        result.hedo += toHex(minsDiurno(inMins, extraEnd));
        result.heno += toHex(minsNocturno(inMins, extraEnd));
      }

      // Extra DESPUÉS del turno
      if (outMins > shiftEnd + TOLERANCIA) {
        const extraStart = Math.max(inMins, shiftEnd);
        result.hedo += toHex(minsDiurno(extraStart, outMins));
        result.heno += toHex(minsNocturno(extraStart, outMins));
      }
    }

    // Redondear acumulados
    result.hefd = Math.round(result.hefd * 100) / 100;
    result.hefn = Math.round(result.hefn * 100) / 100;
    result.hedo = Math.round(result.hedo * 100) / 100;
    result.heno = Math.round(result.heno * 100) / 100;

    return result;
  }

  async calcularExtras(dto: CalcularExtrasDto): Promise<HoraExtra[]> {
    const uid = await this.odoo.authenticate();
    const hoy = getFechaColombiaHoy();

    const startDay = dto.soloHoy ? hoy : dto.startDate;
    const endDay = dto.soloHoy ? hoy : dto.endDate;

    const inicioUTC = startDay ? `${startDay} 05:00:00` : null;
    let finUTC: string | null = null;
    if (endDay) {
      const [a, m, d] = endDay.split('-').map(Number);
      const fd = new Date(a, m - 1, d);
      fd.setDate(fd.getDate() + 1);
      finUTC = `${fd.getFullYear()}-${String(fd.getMonth() + 1).padStart(2, '0')}-${String(fd.getDate()).padStart(2, '0')} 04:59:59`;
    }

    const idsPorEstructura = await this.resolverIdsPorEstructura(
      dto.area_id,
      dto.segmento_id,
    );
    if (idsPorEstructura !== null && idsPorEstructura.length === 0) return [];

    // Dominio para hr.attendance
    const domainAtt: any[] = [];
    if (inicioUTC) domainAtt.push(['check_in', '>=', inicioUTC]);
    if (finUTC) domainAtt.push(['check_in', '<=', finUTC]);
    if (dto.company && dto.company !== 'Todas' && dto.company !== '') {
      domainAtt.push(['employee_id.company_id.name', '=', dto.company]);
    }
    if (idsPorEstructura && idsPorEstructura.length > 0) {
      domainAtt.push(['employee_id', 'in', idsPorEstructura]);
    }

    // Dominio para attendance.log (biométrico / app)
    const domainLog: any[] = [];
    if (inicioUTC) domainLog.push(['punching_time', '>=', inicioUTC]);
    if (finUTC) domainLog.push(['punching_time', '<=', finUTC]);
    if (dto.company && dto.company !== 'Todas' && dto.company !== '') {
      domainLog.push(['company_id.name', '=', dto.company]);
    }
    if (idsPorEstructura && idsPorEstructura.length > 0) {
      domainLog.push(['employee_id', 'in', idsPorEstructura]);
    }

    // Consultar ambos modelos en paralelo
    const [attendances, logs] = await Promise.all([
      this.odoo.executeKw<any[]>(
        'hr.attendance',
        'search_read',
        [domainAtt],
        {
          fields: ['employee_id', 'check_in', 'check_out', 'department_id'],
          limit: 30000000,
          order: 'check_in asc',
        },
        uid,
      ),
      this.odoo.executeKw<any[]>(
        'attendance.log',
        'search_read',
        [domainLog],
        {
          fields: ['employee_id', 'punching_time', 'x_studio_related_field_j40wn'],
          limit: 30000000,
          order: 'punching_time asc',
        },
        uid,
      ),
    ]);

    if (!attendances.length && !logs.length) return [];

    // Agrupar hr.attendance por empId+fecha
    const grupos: Record<
      string,
      {
        empId: number;
        nombre: string;
        dept: string;
        fecha: string;
        records: any[];
      }
    > = {};

    for (const att of attendances) {
      const empId = att.employee_id?.[0];
      const nombre = att.employee_id?.[1] || 'Desconocido';
      const localIn = this.toLocal(att.check_in);
      const fecha = localIn ? localIn.split(' ')[0] : null;
      if (!fecha || !empId) continue;

      const key = `${empId}_${fecha}`;
      if (!grupos[key]) {
        grupos[key] = {
          empId,
          nombre,
          dept: att.department_id ? att.department_id[1] : 'SIN DEPTO',
          fecha,
          records: [],
        };
      }
      grupos[key].records.push(att);
    }

    // Agregar registros de attendance.log para empleados/días no cubiertos por hr.attendance
    // Agrupar punches por empId+fecha
    const idsPermitidos = idsPorEstructura ? new Set(idsPorEstructura) : null;

    const logGrupos: Record<string, { empId: number; nombre: string; dept: string; fecha: string; punches: any[] }> = {};
    for (const log of logs) {
      const empId = log.employee_id?.[0];
      const nombre = log.employee_id?.[1] || 'Desconocido';
      const localTime = this.toLocal(log.punching_time);
      const fecha = localTime ? localTime.split(' ')[0] : null;
      if (!fecha || !empId) continue;

      // Filtro de seguridad: si Odoo no aplicó bien el dominio, lo hacemos aquí
      if (idsPermitidos && !idsPermitidos.has(empId)) continue;

      const key = `${empId}_${fecha}`;
      if (grupos[key]) continue; // ya cubierto por hr.attendance

      if (!logGrupos[key]) {
        const dept = log.x_studio_related_field_j40wn?.[1] || 'SIN DEPTO';
        logGrupos[key] = { empId, nombre, dept, fecha, punches: [] };
      }
      logGrupos[key].punches.push(log);
    }

    // Convertir grupos de attendance.log a registros sintéticos compatibles
    for (const g of Object.values(logGrupos)) {
      const sorted = g.punches.sort(
        (a, b) => new Date(a.punching_time).getTime() - new Date(b.punching_time).getTime(),
      );
      const primero = sorted[0];
      const ultimo = sorted[sorted.length - 1];
      const haySalida =
        sorted.length > 1 &&
        new Date(ultimo.punching_time).getTime() - new Date(primero.punching_time).getTime() >= 60_000;

      const key = `${g.empId}_${g.fecha}`;
      grupos[key] = {
        empId: g.empId,
        nombre: g.nombre,
        dept: g.dept,
        fecha: g.fecha,
        records: [
          {
            employee_id: [g.empId, g.nombre],
            check_in: primero.punching_time,
            check_out: haySalida ? ultimo.punching_time : null,
            department_id: null,
          },
        ],
      };
    }

    const empIds = [
      ...new Set(Object.values(grupos).map((g) => g.empId).filter(Boolean)),
    ] as number[];

    const empleados = await this.odoo.executeKw<any[]>(
      'hr.employee',
      'search_read',
      [[['id', 'in', empIds]]],
      { fields: ['id', 'name', 'identification_id', 'barcode', 'job_id'] },
      uid,
    );

    const cedulaMap = new Map<number, string>();
    const cargoOdooMap = new Map<number, string>();
    empleados.forEach((e) => {
      cedulaMap.set(e.id, e.identification_id || e.barcode || 'N/A');
      if (e.job_id) cargoOdooMap.set(e.id, e.job_id[1] || '');
    });

    // Complementar cargo desde tabla local si no está en Odoo
    const cedulas = [...cedulaMap.values()].filter((c) => c !== 'N/A');
    const usuariosLocales = cedulas.length
      ? await this.usuarioRepo
          .createQueryBuilder('u')
          .select(['u.identificacion', 'u.cargo'])
          .where('u.identificacion IN (:...ids)', {
            ids: cedulas.slice(0, 500),
          })
          .getMany()
      : [];
    const cargoLocalMap = new Map(
      usuariosLocales.map((u) => [u.identificacion, u.cargo]),
    );

    const mallasMap = await this.getMallasMap(empIds);

    const resultados: HoraExtra[] = [];

    for (const g of Object.values(grupos)) {
      const { empId, nombre, dept, fecha, records } = g;

      records.sort(
        (a, b) =>
          new Date(a.check_in).getTime() - new Date(b.check_in).getTime(),
      );
      const primero = records[0];

      const conSalida = records.filter((r) => {
        if (!r.check_out) return false;
        return (
          new Date(r.check_out).getTime() - new Date(r.check_in).getTime() >=
          60_000
        );
      });
      const ultimoConSalida = conSalida.length
        ? conSalida.reduce((best, cur) =>
            new Date(cur.check_out) > new Date(best.check_out) ? cur : best,
          )
        : null;

      const localIn = this.toLocal(primero.check_in);
      const localOut = ultimoConSalida
        ? this.toLocal(ultimoConSalida.check_out)
        : null;

      const asignaciones = mallasMap.get(empId) ?? [];
      const detalles = this.resolverDetallesParaFecha(asignaciones, fecha);
      const diaSemana = this.getDiaSemana(fecha);
      const turnoDetalles = detalles
        .filter((d: any) => Number(d.dia_semana) === diaSemana)
        .sort(
          (a: any, b: any) => Number(a.hora_inicio) - Number(b.hora_inicio),
        );

      const turno = turnoDetalles[0] ?? null;
      const cedula = cedulaMap.get(empId) ?? 'N/A';
      const esDominical = diaSemana === 6;

      // Cargo: primero Odoo, fallback local
      const cargo =
        cargoOdooMap.get(empId) || cargoLocalMap.get(cedula) || null;

      const categorias = this.calcularCategorias(
        localIn,
        localOut,
        turno,
        esDominical,
      );

      // Compatibilidad con campos legacy (minutos)
      const hedo_mins = Math.round(categorias.hedo * 60);
      const hefd_mins = Math.round(categorias.hefd * 60);
      const heno_mins = Math.round(categorias.heno * 60);
      const hefn_mins = Math.round(categorias.hefn * 60);
      const totalMins = hedo_mins + heno_mins + hefd_mins + hefn_mins;

      const registro = this.horaExtraRepo.create({
        cedula,
        nombre,
        employee_id_odoo: empId,
        fecha,
        company: dto.company ?? null,
        departamento: dept,
        cargo,
        fecha_entrada: localIn,
        fecha_salida: localOut,
        calculado_por: dto.calculado_por ?? null,
        es_dominical: esDominical,
        aprobado: null,
        inicio_turno: turno
          ? this.decimalToHora(Number(turno.hora_inicio))
          : null,
        fin_turno: turno ? this.decimalToHora(Number(turno.hora_fin)) : null,
        // Legacy (entrada anticipada: solo si hay hedo puro antes del turno)
        inicio_extra_entrada: null,
        fin_extra_entrada: null,
        minutos_extra_entrada: 0,
        inicio_extra_salida: null,
        fin_extra_salida: null,
        minutos_extra_salida: totalMins,
        total_minutos_extra: totalMins,
        // Categorías colombianas
        ...categorias,
      });

      resultados.push(registro);
    }

    if (dto.registros?.length) {
      const aprobMap = new Map<string, boolean | null>();
      for (const r of dto.registros) {
        aprobMap.set(`${r.cedula}_${r.fecha}`, r.aprobado);
      }
      for (const reg of resultados) {
        const key = `${reg.cedula}_${reg.fecha}`;
        if (aprobMap.has(key)) reg.aprobado = aprobMap.get(key)!;
      }
    }

    if (dto.guardar) {
      if (startDay && endDay) {
        const qb = this.horaExtraRepo
          .createQueryBuilder()
          .delete()
          .from(HoraExtra)
          .where('fecha >= :start AND fecha <= :end', {
            start: startDay,
            end: endDay,
          });
        if (dto.company && dto.company !== 'Todas' && dto.company !== '') {
          qb.andWhere('company = :company', { company: dto.company });
        }
        await qb.execute();
      }

      const SAVE_CHUNK = 50;
      for (let i = 0; i < resultados.length; i += SAVE_CHUNK) {
        await this.horaExtraRepo.save(resultados.slice(i, i + SAVE_CHUNK));
      }
    }

    return resultados;
  }

  async getHistorial(filters: {
    startDate?: string;
    endDate?: string;
    company?: string;
    cedula?: string;
    nombre?: string;
    cargo?: string;
    departamento?: string;
    soloConExtras?: boolean;
    area_id?: number;
    segmento_id?: number;
  }): Promise<HoraExtra[]> {
    const qb = this.horaExtraRepo
      .createQueryBuilder('h')
      .orderBy('h.nombre', 'ASC')
      .addOrderBy('h.fecha', 'ASC');

    if (filters.startDate)
      qb.andWhere('h.fecha >= :start', { start: filters.startDate });
    if (filters.endDate)
      qb.andWhere('h.fecha <= :end', { end: filters.endDate });
    if (filters.company && filters.company !== 'Todas')
      qb.andWhere('h.company = :company', { company: filters.company });
    if (filters.cedula)
      qb.andWhere('h.cedula LIKE :cedula', { cedula: `%${filters.cedula}%` });
    if (filters.nombre)
      qb.andWhere('h.nombre LIKE :nombre', { nombre: `%${filters.nombre}%` });
    if (filters.cargo)
      qb.andWhere('h.cargo LIKE :cargo', { cargo: `%${filters.cargo}%` });
    if (filters.departamento)
      qb.andWhere('h.departamento = :departamento', {
        departamento: filters.departamento,
      });
    if (filters.soloConExtras)
      qb.andWhere(
        '(h.hedo > 0 OR h.heno > 0 OR h.hefd > 0 OR h.hefn > 0 OR h.total_minutos_extra > 0)',
      );

    // Filtro por estructura (área/segmento) → busca cédulas locales
    if (filters.area_id || filters.segmento_id) {
      const where: any = {};
      if (filters.area_id) where.area_id = filters.area_id;
      if (filters.segmento_id) where.segmento_id = filters.segmento_id;
      const usuarios = await this.usuarioRepo.find({
        where,
        select: ['identificacion'],
      });
      const cedulas = usuarios.map((u) => u.identificacion).filter(Boolean);
      if (!cedulas.length) return [];
      qb.andWhere('h.cedula IN (:...cedulas)', {
        cedulas: cedulas.slice(0, 500),
      });
    }

    return qb.getMany();
  }

  async actualizarAprobacion(dto: {
    startDate?: string;
    endDate?: string;
    company?: string;
    tipo: 'todas' | 'dominicales' | 'ninguna';
  }): Promise<{ updated: number }> {
    const aprobadoValor = dto.tipo !== 'ninguna';

    const qb = this.horaExtraRepo
      .createQueryBuilder()
      .update(HoraExtra)
      .set({ aprobado: aprobadoValor });

    if (dto.tipo === 'dominicales') {
      qb.where('es_dominical = 1');
    } else {
      qb.where('1 = 1');
    }

    if (dto.startDate) qb.andWhere('fecha >= :start', { start: dto.startDate });
    if (dto.endDate) qb.andWhere('fecha <= :end', { end: dto.endDate });
    if (dto.company && dto.company !== 'Todas')
      qb.andWhere('company = :company', { company: dto.company });

    const result = await qb.execute();
    return { updated: result.affected ?? 0 };
  }

  async aprobarRegistro(
    id: number,
    aprobado: boolean | null,
  ): Promise<HoraExtra | null> {
    await this.horaExtraRepo.update(id, { aprobado });
    return this.horaExtraRepo.findOne({ where: { id } });
  }

  async exportarExcel(filters: {
    startDate?: string;
    endDate?: string;
    company?: string;
    nombre?: string;
    cargo?: string;
    departamento?: string;
    area_id?: number;
    segmento_id?: number;
  }): Promise<Buffer> {
    const registros = await this.getHistorial({
      ...filters,
      soloConExtras: false,
    });

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Reporte HX');

    // ── Estilos reutilizables ──────────────────────────────────────────────
    const COLS = 14; // A-N (sin APROBAR en el Excel)

    const fillColor = (argb: string): ExcelJS.Fill => ({
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb },
    });

    const borderThin: ExcelJS.Borders = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
      diagonal: { style: 'thin', up: false, down: false },
    };

    const applyBorderAlign = (
      cell: ExcelJS.Cell,
      hAlign: 'left' | 'center' = 'center',
    ) => {
      cell.border = borderThin;
      cell.alignment = { vertical: 'middle' as const, horizontal: hAlign };
    };

    // ── Anchos de columna ──────────────────────────────────────────────────
    const colWidths = [15, 32, 12, 11, 11, 11, 11, 7, 7, 7, 7, 7, 7, 7];
    colWidths.forEach((w, i) => {
      ws.getColumn(i + 1).width = w;
    });

    // ── Cabecera global (filas 1-2) ────────────────────────────────────────
    const encabezadosFila1 = [
      { merge: 'A1:B1', label: 'COLABORADOR' },
      { merge: 'C1:C1', label: 'FECHA' },
      { merge: 'D1:E1', label: 'JORNADA LABORAL' },
      { merge: 'F1:G1', label: 'TIEMPO LABORADO' },
    ];
    encabezadosFila1.forEach(({ merge, label }) => {
      ws.mergeCells(merge);
      const cell = ws.getCell(merge.split(':')[0]);
      cell.value = label;
      cell.fill = fillColor('FF334155');
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
      cell.alignment = {
        horizontal: 'center' as const,
        vertical: 'middle' as const,
      };
      cell.border = borderThin;
    });

    ['H1', 'I1', 'J1', 'K1', 'L1', 'M1', 'N1'].forEach((addr, i) => {
      const cell = ws.getCell(addr);
      cell.value = ['RN', 'RNDF', 'RDDF', 'HEDO', 'HENO', 'HEFD', 'HEFN'][i];
      cell.fill = fillColor('FF334155');
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
      cell.alignment = {
        horizontal: 'center' as const,
        vertical: 'middle' as const,
      };
      cell.border = borderThin;
    });

    const subHeaders = [
      'Cédula',
      'Nombre',
      'Fecha',
      'Hora Inicial',
      'Hora Final',
      'Hora Inicial',
      'Hora Final',
      '0',
      '0',
      '0',
      '0',
      '0',
      '0',
      '0',
    ];
    subHeaders.forEach((v, i) => {
      const cell = ws.getCell(2, i + 1);
      cell.value = v;
      cell.fill = fillColor('FF475569');
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
      applyBorderAlign(cell, i < 2 ? 'left' : 'center');
    });

    ws.getRow(1).height = 18;
    ws.getRow(2).height = 14;

    // ── Datos agrupados por EMPRESA → COLABORADOR ─────────────────────────
    // Ordenar: primero por company, luego por nombre, luego por fecha
    const sorted = [...registros].sort((a, b) => {
      const cmp = (a.company ?? '').localeCompare(b.company ?? '');
      if (cmp !== 0) return cmp;
      const cmpN = (a.nombre ?? '').localeCompare(b.nombre ?? '');
      if (cmpN !== 0) return cmpN;
      return (a.fecha ?? '').localeCompare(b.fecha ?? '');
    });

    // Agrupar: empresa → colaborador → filas
    const empresas = new Map<string, Map<string, HoraExtra[]>>();
    for (const r of sorted) {
      const emp = r.company ?? 'SIN EMPRESA';
      const colab = `${r.cedula}__${r.nombre}`;
      if (!empresas.has(emp)) empresas.set(emp, new Map());
      const colabs = empresas.get(emp)!;
      if (!colabs.has(colab)) colabs.set(colab, []);
      colabs.get(colab)!.push(r);
    }

    let rowIdx = 3;
    const numFmt = '0.00';
    const COLS_HX = [
      'rn',
      'rndf',
      'rddf',
      'hedo',
      'heno',
      'hefd',
      'hefn',
    ] as const;

    for (const [empresa, colabMap] of empresas) {
      // ── Fila de empresa ──────────────────────────────────────────────────
      ws.mergeCells(rowIdx, 1, rowIdx, COLS);
      const empCell = ws.getCell(rowIdx, 1);
      empCell.value = empresa.toUpperCase();
      empCell.fill = fillColor('FF1E293B');
      empCell.font = {
        bold: true,
        color: { argb: 'FFFFFFFF' },
        size: 9,
        italic: true,
      };
      empCell.alignment = {
        horizontal: 'left' as const,
        vertical: 'middle' as const,
      };
      empCell.border = borderThin;
      ws.getRow(rowIdx).height = 14;
      rowIdx++;

      for (const [, filas] of colabMap) {
        // ── Filas de datos ───────────────────────────────────────────────
        filas.forEach((r, fi) => {
          const row = ws.getRow(rowIdx);
          const fechaDisplay = r.fecha
            ? r.fecha.split('-').reverse().join('/')
            : '';
          const horaEntrada = r.fecha_entrada
            ? (r.fecha_entrada.split(' ')[1]?.slice(0, 5) ?? '')
            : '';
          const horaSalida = r.fecha_salida
            ? (r.fecha_salida.split(' ')[1]?.slice(0, 5) ?? '')
            : '';

          const values = [
            r.cedula,
            r.nombre,
            fechaDisplay,
            r.inicio_turno ?? '',
            r.fin_turno ?? '',
            horaEntrada,
            horaSalida,
            Number(r.rn) || 0,
            Number(r.rndf) || 0,
            Number(r.rddf) || 0,
            Number(r.hedo) || 0,
            Number(r.heno) || 0,
            Number(r.hefd) || 0,
            Number(r.hefn) || 0,
          ];
          values.forEach((v, ci) => {
            row.getCell(ci + 1).value = v as any;
          });

          // Formato numérico cols HX
          for (let c = 8; c <= 14; c++) row.getCell(c).numFmt = numFmt;

          // Estilos por celda
          const bgRow = fi % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC';
          for (let c = 1; c <= COLS; c++) {
            const cell = row.getCell(c);
            cell.fill = fillColor(bgRow);
            cell.font = { size: 9 };
            applyBorderAlign(cell, c <= 2 ? 'left' : 'center');
          }
          row.height = 13;
          rowIdx++;
        });

        // ── Subtotal colaborador ─────────────────────────────────────────
        const stRow = ws.getRow(rowIdx);
        const first = filas[0];
        stRow.getCell(1).value = first.cedula;
        stRow.getCell(2).value = `SUBTOTAL – ${first.nombre}`;

        COLS_HX.forEach((col, i) => {
          const val = filas.reduce((s, r) => s + (Number(r[col]) || 0), 0);
          const cell = stRow.getCell(8 + i);
          cell.value = Math.round(val * 100) / 100;
          cell.numFmt = numFmt;
        });

        for (let c = 1; c <= COLS; c++) {
          const cell = stRow.getCell(c);
          cell.fill = fillColor('FFFFF3CD');
          cell.font = { bold: true, size: 9 };
          applyBorderAlign(cell, c <= 2 ? 'left' : 'center');
        }
        stRow.height = 14;
        rowIdx++;
      }

      // Fila vacía entre empresas
      rowIdx++;
    }

    // ── Notas y convenciones al pie ────────────────────────────────────────
    rowIdx++;
    const notas = [
      'NOTA IMPORTANTE: Para la correcta liquidación de las horas extras, es necesario reportar los datos en el sistema sexagesimal. Ejemplo: 15 minutos = 0,25; 30 minutos = 0,50; 45 minutos = 0,75; 60 minutos = 1,0',
      'Se debe subtotalizar por colaborador el número de Horas Extras o Suplementarias laboradas.',
      'Se debe hacer un formato de reporte diferenciando la empresa por la cual están vinculados los colaboradores.',
      '',
      'CONVENCIONES:',
      'RN = Recargo Nocturno: Dentro de la jornada laboral de 21:00 Hr a 6:00 Hr',
      'RNDF = Recargo Nocturno Dominical o Festivo: Dentro de la jornada Laboral, Domingo, de 21:00 Hr y 6:00 Hr',
      'RDDF = Recargo Diurno Dominical o Festivo: Dentro de la Jornada laboral, Domingo o Días Festivos de 6:00 Hr y 21:00 Hr',
      'HEDO = Hora Extra Diurna Ordinaria: Hora adicional a su jornada laboral, de 6:00 Hr y 21:00 Hr',
      'HENO = Hora Extra Nocturna Ordinaria: Hora adicional a su jornada laboral, de 21:00 Hr y 6:00 Hr',
      'HEFD = Hora Extra Festiva Diurna: Hora adicional a su jornada laboral, Domingo o Festivo, 6:00 Hr y 21:00 Hr',
      'HEFN = Hora Extra Festiva Nocturna: Hora adicional a su jornada laboral, Domingo o Festivo, de 21:00 Hr y 6:00 Hr',
    ];

    notas.forEach((texto) => {
      ws.mergeCells(rowIdx, 1, rowIdx, COLS);
      const cell = ws.getCell(rowIdx, 1);
      cell.value = texto;
      const isTitulo = texto === 'CONVENCIONES:';
      const isNota = texto.startsWith('NOTA IMPORTANTE');
      cell.font = {
        bold: isTitulo || isNota,
        italic: !isTitulo && !isNota && texto !== '',
        size: 8,
        color: { argb: texto === '' ? 'FFFFFFFF' : 'FF334155' },
      };
      cell.alignment = {
        horizontal: 'left' as const,
        vertical: 'middle' as const,
        wrapText: true,
      };
      ws.getRow(rowIdx).height = isNota ? 24 : 13;
      rowIdx++;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // CARGUE MANUAL DE HORAS EXTRA DESDE EXCEL
  // ══════════════════════════════════════════════════════════════════════════════

  async generarPlantillaCargue(): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Cargue Horas Extra');

    ws.columns = [
      { header: 'CÉDULA', key: 'cedula', width: 15 },
      { header: 'NOMBRE', key: 'nombre', width: 30 },
      { header: 'FECHA (YYYY-MM-DD)', key: 'fecha', width: 20 },
      { header: 'HORA INI. JORNADA', key: 'inicio_turno', width: 18 },
      { header: 'HORA FIN JORNADA', key: 'fin_turno', width: 18 },
      { header: 'HORA INI. LABORADO', key: 'hora_inicio_laborado', width: 20 },
      { header: 'HORA FIN LABORADO', key: 'hora_fin_laborado', width: 20 },
      { header: 'RN', key: 'rn', width: 8 },
      { header: 'RNDF', key: 'rndf', width: 8 },
      { header: 'RDDF', key: 'rddf', width: 8 },
      { header: 'HEDO', key: 'hedo', width: 8 },
      { header: 'HENO', key: 'heno', width: 8 },
      { header: 'HEFD', key: 'hefd', width: 8 },
      { header: 'HEFN', key: 'hefn', width: 8 },
    ];

    const headerRow = ws.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF334155' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFFF8F00' } },
      };
    });
    headerRow.height = 22;

    // Fila de ejemplo
    const exRow = ws.addRow([
      '1003618766',
      'EJEMPLO COLABORADOR',
      '2026-04-28',
      '07:00',
      '17:00',
      '05:56',
      '22:06',
      '0',
      '0',
      '0',
      '0',
      '0',
      '0',
      '0',
    ]);
    exRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFF8E1' },
      };
      cell.font = { italic: true, size: 9, color: { argb: 'FF78716C' } };
      cell.alignment = { horizontal: 'center' };
    });

    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf);
  }

  async procesarCargueExcel(
    fileBuffer: any,
    meta: {
      company?: string;
      departamento?: string;
      area_id?: number;
      segmento_id?: number;
      cargado_por?: string;
    },
  ): Promise<{ guardados: number; errores: string[] }> {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(fileBuffer);
    const ws = wb.worksheets[0];

    const registros: HoraExtraCargue[] = [];
    const errores: string[] = [];

    const parseNum = (val: any): number => {
      const n = parseFloat(String(val ?? '0').replace(',', '.'));
      return isNaN(n) ? 0 : n;
    };

    const parseText = (val: any): string | null => {
      const t = String(val ?? '').trim();
      return t === '' || t === 'null' || t === 'undefined' ? null : t;
    };

    ws.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // encabezado

      const nombre = parseText(row.getCell(2).value);
      const fecha = parseText(row.getCell(3).value);

      if (!nombre || !fecha) {
        errores.push(`Fila ${rowNumber}: Nombre y Fecha son obligatorios`);
        return;
      }

      // Validar formato de fecha
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        errores.push(
          `Fila ${rowNumber}: Fecha "${fecha}" no tiene formato YYYY-MM-DD`,
        );
        return;
      }

      const reg = this.cargueRepo.create({
        cedula: parseText(row.getCell(1).value),
        nombre,
        fecha,
        inicio_turno: parseText(row.getCell(4).value),
        fin_turno: parseText(row.getCell(5).value),
        hora_inicio_laborado: parseText(row.getCell(6).value),
        hora_fin_laborado: parseText(row.getCell(7).value),
        rn: parseNum(row.getCell(8).value),
        rndf: parseNum(row.getCell(9).value),
        rddf: parseNum(row.getCell(10).value),
        hedo: parseNum(row.getCell(11).value),
        heno: parseNum(row.getCell(12).value),
        hefd: parseNum(row.getCell(13).value),
        hefn: parseNum(row.getCell(14).value),
        company: meta.company ?? null,
        departamento: meta.departamento ?? null,
        area_id: meta.area_id ?? null,
        segmento_id: meta.segmento_id ?? null,
        cargado_por: meta.cargado_por ?? null,
        aprobado: null,
      });

      registros.push(reg);
    });

    if (registros.length > 0) {
      // Guardar en lotes de 100
      for (let i = 0; i < registros.length; i += 100) {
        await this.cargueRepo.save(registros.slice(i, i + 100));
      }
    }

    return { guardados: registros.length, errores };
  }

  async getHistorialCargue(filters: {
    startDate?: string;
    endDate?: string;
    company?: string;
    departamento?: string;
    area_id?: number;
    segmento_id?: number;
  }): Promise<HoraExtraCargue[]> {
    const qb = this.cargueRepo.createQueryBuilder('c');

    if (filters.startDate)
      qb.andWhere('c.fecha >= :s', { s: filters.startDate });
    if (filters.endDate) qb.andWhere('c.fecha <= :e', { e: filters.endDate });
    if (filters.company)
      qb.andWhere('c.company = :co', { co: filters.company });
    if (filters.departamento)
      qb.andWhere('c.departamento LIKE :d', { d: `%${filters.departamento}%` });
    if (filters.area_id) qb.andWhere('c.area_id = :a', { a: filters.area_id });
    if (filters.segmento_id)
      qb.andWhere('c.segmento_id = :sg', { sg: filters.segmento_id });

    return qb.orderBy('c.nombre', 'ASC').addOrderBy('c.fecha', 'ASC').getMany();
  }

  async aprobarCargue(id: number, aprobado: boolean | null): Promise<void> {
    await this.cargueRepo.update(id, { aprobado });
  }
}
