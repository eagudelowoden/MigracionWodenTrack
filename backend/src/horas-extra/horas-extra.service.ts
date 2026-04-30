import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HoraExtra } from './entities/hora-extra.entity';
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
    const where: any = {};
    if (areaId) where.area_id = areaId;
    if (segmentoId) where.segmento_id = segmentoId;
    const usuarios = await this.usuarioRepo.find({ where, select: ['id_odoo'] });
    return usuarios.map((u) => u.id_odoo).filter((id) => id != null);
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

  private resolverDetallesParaFecha(
    asignaciones: any[],
    fecha: string,
  ): any[] {
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

    const anterior = asignaciones.find(
      (a) => toStr(a.fecha_inicio) <= fecha,
    );
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
  ): Pick<HoraExtra, 'rn' | 'rndf' | 'rddf' | 'hedo' | 'heno' | 'hefd' | 'hefn'> {
    const result = { rn: 0, rndf: 0, rddf: 0, hedo: 0, heno: 0, hefd: 0, hefn: 0 };

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
      // Día ordinario con malla
      if (!turno) return result;

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

    const domain: any[] = [];
    if (inicioUTC) domain.push(['check_in', '>=', inicioUTC]);
    if (finUTC) domain.push(['check_in', '<=', finUTC]);
    if (dto.company && dto.company !== 'Todas' && dto.company !== '') {
      domain.push(['employee_id.company_id.name', '=', dto.company]);
    }
    if (idsPorEstructura && idsPorEstructura.length > 0) {
      domain.push(['employee_id', 'in', idsPorEstructura]);
    }

    const attendances = await this.odoo.executeKw<any[]>(
      'hr.attendance',
      'search_read',
      [domain],
      {
        fields: ['employee_id', 'check_in', 'check_out', 'department_id'],
        limit: 30000000,
        order: 'check_in asc',
      },
      uid,
    );

    if (!attendances.length) return [];

    const empIds = [
      ...new Set(
        attendances.map((a) => a.employee_id?.[0]).filter(Boolean),
      ),
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
          .where('u.identificacion IN (:...ids)', { ids: cedulas.slice(0, 500) })
          .getMany()
      : [];
    const cargoLocalMap = new Map(
      usuariosLocales.map((u) => [u.identificacion, u.cargo]),
    );

    const mallasMap = await this.getMallasMap(empIds);

    const grupos: Record<
      string,
      { empId: number; nombre: string; dept: string; fecha: string; records: any[] }
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
        .sort((a: any, b: any) => Number(a.hora_inicio) - Number(b.hora_inicio));

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
        inicio_turno: turno ? this.decimalToHora(Number(turno.hora_inicio)) : null,
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
      const cedulas = usuarios
        .map((u) => u.identificacion)
        .filter(Boolean);
      if (!cedulas.length) return [];
      qb.andWhere('h.cedula IN (:...cedulas)', { cedulas: cedulas.slice(0, 500) });
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

  async aprobarRegistro(id: number, aprobado: boolean | null): Promise<HoraExtra> {
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
    const registros = await this.getHistorial({ ...filters, soloConExtras: false });

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Reporte HX');

    // Estilos
    const headerFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF334155' },
    };
    const subHeaderFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF475569' },
    };
    const subtotalFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFD580' },
    };
    const aprobadoFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD1FAE5' },
    };
    const pendienteFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFF7ED' },
    };

    const borderThin: Partial<ExcelJS.Borders> = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };

    // Fila 1: grupos de encabezado
    ws.mergeCells('A1:B1');
    ws.getCell('A1').value = 'COLABORADOR';
    ws.mergeCells('C1:C1');
    ws.getCell('C1').value = 'FECHA';
    ws.mergeCells('D1:E1');
    ws.getCell('D1').value = 'JORNADA LABORAL';
    ws.mergeCells('F1:G1');
    ws.getCell('F1').value = 'TIEMPO LABORADO';
    ['H1', 'I1', 'J1', 'K1', 'L1', 'M1', 'N1', 'O1'].forEach((cell, i) => {
      ws.getCell(cell).value = ['RN', 'RNDF', 'RDDF', 'HEDO', 'HENO', 'HEFD', 'HEFN', 'APROBAR'][i];
    });

    // Fila 2: sub-encabezados
    ws.getCell('A2').value = 'Cédula';
    ws.getCell('B2').value = 'Nombre';
    ws.getCell('C2').value = 'Fecha';
    ws.getCell('D2').value = 'Hora Inicial';
    ws.getCell('E2').value = 'Hora Final';
    ws.getCell('F2').value = 'Hora Inicial';
    ws.getCell('G2').value = 'Hora Final';
    ['H2', 'I2', 'J2', 'K2', 'L2', 'M2', 'N2'].forEach((c) => {
      ws.getCell(c).value = '0';
    });
    ws.getCell('O2').value = 'Estado';

    // Aplicar estilo a encabezados
    for (let col = 1; col <= 15; col++) {
      const c1 = ws.getCell(1, col);
      const c2 = ws.getCell(2, col);
      [c1, c2].forEach((c) => {
        c.fill = headerFill;
        c.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
        c.alignment = { horizontal: 'center', vertical: 'middle' };
        c.border = borderThin;
      });
      c2.fill = subHeaderFill;
    }

    ws.getRow(1).height = 20;
    ws.getRow(2).height = 16;

    // Anchos
    const colWidths = [14, 30, 12, 12, 12, 12, 12, 7, 7, 7, 7, 7, 7, 7, 10];
    colWidths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });

    // Agrupar por colaborador para subtotales
    const grupos: Map<string, HoraExtra[]> = new Map();
    for (const r of registros) {
      const key = `${r.cedula}__${r.nombre}`;
      if (!grupos.has(key)) grupos.set(key, []);
      grupos.get(key)!.push(r);
    }

    let rowIdx = 3;
    const numFmt = '0.00';

    for (const [, filas] of grupos) {
      for (const r of filas) {
        const row = ws.getRow(rowIdx);
        const fechaDisplay = r.fecha
          ? r.fecha.split('-').reverse().join('/')
          : '';
        const horaEntrada = r.fecha_entrada
          ? r.fecha_entrada.split(' ')[1]?.slice(0, 5) ?? ''
          : '';
        const horaSalida = r.fecha_salida
          ? r.fecha_salida.split(' ')[1]?.slice(0, 5) ?? ''
          : '';

        row.values = [
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
          r.aprobado === true ? 'APROBADO' : r.aprobado === false ? 'RECHAZADO' : 'PENDIENTE',
        ];

        // Formato numérico para columnas HX
        for (let c = 8; c <= 14; c++) {
          row.getCell(c).numFmt = numFmt;
        }

        // Color por aprobación
        const aprobCell = row.getCell(15);
        if (r.aprobado === true) {
          aprobCell.fill = aprobadoFill;
          aprobCell.font = { color: { argb: 'FF065F46' }, bold: true, size: 9 };
        } else if (r.aprobado === false) {
          aprobCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
          aprobCell.font = { color: { argb: 'FF991B1B' }, bold: true, size: 9 };
        } else {
          aprobCell.fill = pendienteFill;
          aprobCell.font = { color: { argb: 'FF92400E' }, bold: true, size: 9 };
        }

        row.eachCell({ includeEmpty: true }, (cell, colNum) => {
          if (colNum <= 15) {
            cell.border = borderThin;
            cell.alignment = { vertical: 'middle', horizontal: colNum <= 2 ? 'left' : 'center' };
            if (!cell.font) cell.font = { size: 9 };
            else cell.font = { ...cell.font, size: 9 };
          }
        });

        rowIdx++;
      }

      // Fila de subtotal por colaborador
      const st = ws.getRow(rowIdx);
      const first = filas[0];
      st.getCell(1).value = first.cedula;
      st.getCell(2).value = `SUBTOTAL – ${first.nombre}`;

      const sumCols = ['rn', 'rndf', 'rddf', 'hedo', 'heno', 'hefd', 'hefn'] as const;
      sumCols.forEach((col, i) => {
        const val = filas.reduce((s, r) => s + (Number(r[col]) || 0), 0);
        st.getCell(8 + i).value = Math.round(val * 100) / 100;
        st.getCell(8 + i).numFmt = numFmt;
      });

      st.eachCell({ includeEmpty: true }, (cell, colNum) => {
        if (colNum <= 15) {
          cell.fill = subtotalFill;
          cell.font = { bold: true, size: 9 };
          cell.border = borderThin;
          cell.alignment = { vertical: 'middle', horizontal: colNum <= 2 ? 'left' : 'center' };
        }
      });

      rowIdx++;
    }

    // Nota al pie
    ws.getRow(rowIdx + 1).getCell(1).value =
      'NOTA: Valores en sistema sexagesimal. 15 min = 0,25 | 30 min = 0,50 | 45 min = 0,75 | 60 min = 1,0';
    ws.getRow(rowIdx + 1).getCell(1).font = { italic: true, size: 8, color: { argb: 'FF64748B' } };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
