import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HoraExtra } from './entities/hora-extra.entity';
import { HoraExtraCargue } from './entities/hora-extra-cargue.entity';
import { MallaAsignacion } from '../mallas/entities/malla-asignacion.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { OdooService } from '../odoo/odoo.service';
import { MailService } from '../logsEmail/mail.service';
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
// Usado para RNDF, HENO, HEFN. Soporta end > 1440 para turnos que cruzan medianoche
function minsNocturno(start: number, end: number): number {
  if (end <= start) return 0;
  if (end <= 1440) {
    return overlap(start, end, 1260, 1440) + overlap(start, end, 0, 360);
  }
  // Cruce de medianoche: antes de las 24:00 y después de las 00:00
  const antesMedianoche = overlap(start, 1440, 1260, 1440) + overlap(start, 1440, 0, 360);
  const despuesMedianoche = overlap(0, end - 1440, 1260, 1440) + overlap(0, end - 1440, 0, 360);
  return antesMedianoche + despuesMedianoche;
}

// Minutos de Recargo Nocturno (RN) en el rango [start, end] (19:00-06:00 = 1140-1440 y 0-360)
// RN inicia a las 19:00. Soporta end > 1440 para turnos que cruzan medianoche.
function minsRN(start: number, end: number): number {
  if (end <= start) return 0;
  if (end <= 1440) {
    return overlap(start, end, 1140, 1440) + overlap(start, end, 0, 360);
  }
  const antesMedianoche = overlap(start, 1440, 1140, 1440) + overlap(start, 1440, 0, 360);
  const despuesMedianoche = overlap(0, end - 1440, 1140, 1440) + overlap(0, end - 1440, 0, 360);
  return antesMedianoche + despuesMedianoche;
}

// Minutos diurnos en el rango [start, end] (06:00-21:00 = 360-1260)
// Soporta end > 1440 para turnos que cruzan medianoche
function minsDiurno(start: number, end: number): number {
  if (end <= start) return 0;
  if (end <= 1440) {
    return overlap(start, end, 360, 1260);
  }
  // Cruce de medianoche
  const antesMedianoche = overlap(start, 1440, 360, 1260);
  const despuesMedianoche = overlap(0, end - 1440, 360, 1260);
  return antesMedianoche + despuesMedianoche;
}

// Minutos → horas sexagesimales redondeadas a 2 decimales (60→1.0, 30→0.50)
function toHex(minutes: number): number {
  return Math.round((minutes / 60) * 100) / 100;
}

// Redondeo laboral: si los minutos de la fracción son ≥ 55, sube a la hora completa.
// Ej: 5.93h (5h56min) → 6.00h  |  5.50h (5h30min) → 5.50h  |  6.93h (6h56min) → 7.00h
function redondearHoras(horas: number): number {
  if (horas <= 0) return 0;
  const enteras = Math.floor(horas);
  const mins    = Math.round((horas - enteras) * 60);
  return mins >= 55 ? enteras + 1 : Math.round(horas * 100) / 100;
}

// ─── Festivos colombianos ─────────────────────────────────────────────────────

/** Algoritmo Meeus/Jones/Butcher para obtener la fecha de Pascua */
function calcularEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/** Traslada al siguiente lunes (ley Emiliani). Si ya es lunes no se mueve. */
function siguienteLunes(date: Date): Date {
  const dow = date.getDay(); // 0=Dom … 6=Sáb
  const d = new Date(date);
  d.setDate(d.getDate() + (8 - dow) % 7); // dow=1 → +0 (permanece lunes)
  return d;
}

function addDias(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toYMD(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Devuelve el conjunto de fechas YYYY-MM-DD que son festivos nacionales
 * en Colombia para el año dado (Ley 51/1983 + Ley 797/2003).
 */
function getFestivosColombiaAnio(year: number): Set<string> {
  const f = new Set<string>();

  // ── Fijos (no se trasladan) ──────────────────────────────────────
  f.add(`${year}-01-01`); // Año Nuevo
  f.add(`${year}-05-01`); // Día del Trabajo
  f.add(`${year}-07-20`); // Independencia
  f.add(`${year}-08-07`); // Batalla de Boyacá
  f.add(`${year}-12-08`); // Inmaculada Concepción
  f.add(`${year}-12-25`); // Navidad

  // ── Emiliani (se trasladan al lunes si no caen en lunes) ─────────
  for (const d of [
    new Date(year, 0, 6),   // Reyes Magos (6 ene)
    new Date(year, 2, 19),  // San José (19 mar)
    new Date(year, 5, 29),  // San Pedro y San Pablo (29 jun)
    new Date(year, 7, 15),  // Asunción de la Virgen (15 ago)
    new Date(year, 9, 12),  // Día de la Raza (12 oct)
    new Date(year, 10, 1),  // Todos los Santos (1 nov)
    new Date(year, 10, 11), // Independencia de Cartagena (11 nov)
  ]) {
    f.add(toYMD(siguienteLunes(d)));
  }

  // ── Basados en Semana Santa ──────────────────────────────────────
  const easter = calcularEaster(year);
  f.add(toYMD(addDias(easter, -3)));                    // Jueves Santo
  f.add(toYMD(addDias(easter, -2)));                    // Viernes Santo
  f.add(toYMD(siguienteLunes(addDias(easter, 39))));    // Ascensión del Señor
  f.add(toYMD(siguienteLunes(addDias(easter, 60))));    // Corpus Christi
  f.add(toYMD(siguienteLunes(addDias(easter, 68))));    // Sagrado Corazón de Jesús

  return f;
}

/**
 * Construye el Set de festivos para todos los años presentes en el rango.
 * Se añade también el año siguiente al rango para cubrir turnos que cruzan
 * el 31 de diciembre.
 */
function buildFestivosSet(startDay: string | undefined | null, endDay: string | undefined | null): Set<string> {
  const yearStart = startDay ? parseInt(startDay.slice(0, 4), 10) : new Date().getFullYear();
  const yearEnd   = endDay   ? parseInt(endDay.slice(0, 4),   10) : yearStart;
  const result = new Set<string>();
  for (let y = yearStart; y <= yearEnd + 1; y++) {
    for (const d of getFestivosColombiaAnio(y)) result.add(d);
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────

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
    private readonly mail: MailService,
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

  /**
   * Calcula las categorías de horas extra para un registro.
   *
   * Cuando el turno cruza la medianoche (outMins > 1440), las horas se parten
   * en dos porciones calendáricas:
   *   - Día 1 [inMins … 1440]: se aplica el tipo del día de entrada (esFestivo)
   *   - Día 2 [0 … outMins-1440]: se aplica el tipo del día siguiente (esFestivoSiguiente)
   *
   * Esto permite, p.ej., que un turno nocturno que inicia en festivo y termina
   * en día ordinario produzca RNDF (festivo) + RN (ordinario) en vez de todo RNDF.
   */
  private calcularCategorias(
    localIn: string | null,
    localOut: string | null,
    turno: any | null,
    esFestivo: boolean,
    esFestivoSiguiente: boolean = false,
    retrasoMins: number = 0,
  ): Pick<HoraExtra, 'rn' | 'rndf' | 'rddf' | 'hedo' | 'heno' | 'hefd' | 'hefn'> {
    const result = { rn: 0, rndf: 0, rddf: 0, hedo: 0, heno: 0, hefd: 0, hefn: 0 };
    if (!localIn || !localOut) return result;

    const inMins = this.parseMinutos(localIn);
    let outMins  = this.parseMinutos(localOut);
    if (outMins < inMins) outMins += 1440; // normalizar cruce de medianoche
    if (outMins <= inMins) return result;

    const TOLERANCIA = HorasExtraService.TOLERANCIA_MINS;

    // Límites del turno normalizados (nocturno: shiftEnd > 1440)
    let shiftStart: number | null = null;
    let shiftEnd:   number | null = null;
    if (turno) {
      shiftStart = Number(turno.hora_inicio) * 60;
      shiftEnd   = Number(turno.hora_fin)    * 60;
      if (shiftEnd <= shiftStart) shiftEnd += 1440;
    }

    if (outMins <= 1440) {
      // ── Sin cruce de medianoche ──────────────────────────────────────────────
      //
      // finEfectivo: el turno "efectivo" se extiende por el retraso de llegada,
      // así las primeras retrasoMins después del turno son reposición (no extras).
      // Solo aplica a la salida tardía; la llegada anticipada no se ve afectada.
      const finEfectivo = shiftEnd !== null ? shiftEnd + retrasoMins : null;

      if (esFestivo) {
        if (shiftStart !== null && shiftEnd !== null && finEfectivo !== null) {
          const dentroStart = Math.max(inMins, shiftStart);
          const dentroEnd   = Math.min(outMins, shiftEnd);
          if (dentroEnd > dentroStart) {
            result.rddf = toHex(minsDiurno(dentroStart, dentroEnd));
            result.rndf = toHex(minsNocturno(dentroStart, dentroEnd));
          }
          if (inMins < shiftStart - TOLERANCIA) {
            const extraEnd = Math.min(outMins, shiftStart);
            result.hefd += toHex(minsDiurno(inMins, extraEnd));
            result.hefn += toHex(minsNocturno(inMins, extraEnd));
          }
          if (outMins > finEfectivo + TOLERANCIA) {
            const extraStart = Math.max(inMins, finEfectivo);
            result.hefd += toHex(minsDiurno(extraStart, outMins));
            result.hefn += toHex(minsNocturno(extraStart, outMins));
          }
        } else {
          result.hefd = toHex(minsDiurno(inMins, outMins));
          result.hefn = toHex(minsNocturno(inMins, outMins));
        }
      } else {
        if (!turno || shiftStart === null || shiftEnd === null || finEfectivo === null) {
          // Sin turno en día ordinario: todo el tiempo trabajado es HEDO/HENO
          result.hedo = toHex(minsDiurno(inMins, outMins));
          result.heno = toHex(minsNocturno(inMins, outMins));
        } else {
          result.rn = toHex(minsNocturno(shiftStart, shiftEnd));
          if (inMins < shiftStart - TOLERANCIA) {
            const extraEnd = Math.min(outMins, shiftStart);
            result.hedo += toHex(minsDiurno(inMins, extraEnd));
            result.heno += toHex(minsNocturno(inMins, extraEnd));
          }
          if (outMins > finEfectivo + TOLERANCIA) {
            const extraStart = Math.max(inMins, finEfectivo);
            result.hedo += toHex(minsDiurno(extraStart, outMins));
            result.heno += toHex(minsNocturno(extraStart, outMins));
          }
        }
      }
    } else {
      // ── Cruce de medianoche: partir en Día 1 y Día 2 ────────────────────────
      //
      // El retraso solo afecta la salida (Día 2): la persona debe quedarse
      // retrasoMins más allá de su fin de turno en Día 2 para reponer.
      const day1TurnoStart = shiftStart;
      const day1TurnoEnd   = shiftEnd !== null ? Math.min(shiftEnd, 1440) : null;
      const day2TurnoStart = shiftStart !== null ? 0 : null;
      const day2TurnoEnd   = shiftEnd  !== null ? Math.max(0, shiftEnd - 1440) : null;

      // Porción Día 1 → sin retraso (la salida no ocurre en Día 1)
      this.acumularPorcion(
        result, inMins, 1440,
        day1TurnoStart, day1TurnoEnd,
        esFestivo, TOLERANCIA, 0,
      );

      // Porción Día 2 → aplica retraso en el fin efectivo del turno
      this.acumularPorcion(
        result, 0, outMins - 1440,
        day2TurnoStart, day2TurnoEnd,
        esFestivoSiguiente, TOLERANCIA, retrasoMins,
      );
    }

    // Redondeo laboral: minutos ≥ 55 en la fracción → sube a la hora completa
    result.rn   = redondearHoras(result.rn);
    result.rndf = redondearHoras(result.rndf);
    result.rddf = redondearHoras(result.rddf);
    result.hefd = redondearHoras(result.hefd);
    result.hefn = redondearHoras(result.hefn);
    result.hedo = redondearHoras(result.hedo);
    result.heno = redondearHoras(result.heno);
    return result;
  }

  /**
   * Acumula las categorías de horas para una ventana de trabajo [wStart, wEnd]
   * dentro de un único día (valores en minutos, rango 0-1440).
   *
   * @param turnoStart  inicio del turno en este día (null → sin turno)
   * @param turnoEnd    fin del turno en este día   (null → sin turno)
   * @param esFestivoDia true si este día es festivo o dominical
   */
  private acumularPorcion(
    result: { rn: number; rndf: number; rddf: number; hedo: number; heno: number; hefd: number; hefn: number },
    wStart: number,
    wEnd: number,
    turnoStart: number | null,
    turnoEnd: number | null,
    esFestivoDia: boolean,
    TOLERANCIA: number,
    retrasoMins: number = 0,
  ): void {
    if (wEnd <= wStart) return;

    const hayTurno = turnoStart !== null && turnoEnd !== null && turnoEnd > turnoStart;
    // Fin efectivo del turno: se extiende retrasoMins para descontar la reposición
    const finEfectivo = turnoEnd !== null ? turnoEnd + retrasoMins : null;

    if (esFestivoDia) {
      if (hayTurno) {
        // Horas dentro del turno en día festivo → RDDF + RNDF
        const dentroStart = Math.max(wStart, turnoStart!);
        const dentroEnd   = Math.min(wEnd,   turnoEnd!);
        if (dentroEnd > dentroStart) {
          result.rddf += toHex(minsDiurno(dentroStart, dentroEnd));
          result.rndf += toHex(minsNocturno(dentroStart, dentroEnd));
        }
        // Extra antes del turno → HEFD + HEFN
        if (wStart < turnoStart! - TOLERANCIA) {
          const extraEnd = Math.min(wEnd, turnoStart!);
          if (extraEnd > wStart) {
            result.hefd += toHex(minsDiurno(wStart, extraEnd));
            result.hefn += toHex(minsNocturno(wStart, extraEnd));
          }
        }
        // Extra después del fin efectivo → HEFD + HEFN
        if (finEfectivo !== null && wEnd > finEfectivo + TOLERANCIA) {
          const extraStart = Math.max(wStart, finEfectivo);
          if (wEnd > extraStart) {
            result.hefd += toHex(minsDiurno(extraStart, wEnd));
            result.hefn += toHex(minsNocturno(extraStart, wEnd));
          }
        }
      } else {
        // Sin turno en día festivo: toda la ventana es extra festiva
        result.hefd += toHex(minsDiurno(wStart, wEnd));
        result.hefn += toHex(minsNocturno(wStart, wEnd));
      }
    } else {
      // Día ordinario sin turno: todo el tiempo trabajado es HEDO/HENO
      if (!hayTurno) {
        result.hedo += toHex(minsDiurno(wStart, wEnd));
        result.heno += toHex(minsNocturno(wStart, wEnd));
        return;
      }
      // Recargo nocturno dentro del turno → RN
      const dentroStart = Math.max(wStart, turnoStart!);
      const dentroEnd   = Math.min(wEnd,   turnoEnd!);
      if (dentroEnd > dentroStart) {
        result.rn += toHex(minsNocturno(dentroStart, dentroEnd));
      }
      // Extra antes del turno → HEDO + HENO
      if (wStart < turnoStart! - TOLERANCIA) {
        const extraEnd = Math.min(wEnd, turnoStart!);
        if (extraEnd > wStart) {
          result.hedo += toHex(minsDiurno(wStart, extraEnd));
          result.heno += toHex(minsNocturno(wStart, extraEnd));
        }
      }
      // Extra después del fin efectivo → HEDO + HENO
      if (finEfectivo !== null && wEnd > finEfectivo + TOLERANCIA) {
        const extraStart = Math.max(wStart, finEfectivo);
        if (wEnd > extraStart) {
          result.hedo += toHex(minsDiurno(extraStart, wEnd));
          result.heno += toHex(minsNocturno(extraStart, wEnd));
        }
      }
    }
  }

  async calcularExtras(dto: CalcularExtrasDto): Promise<HoraExtra[]> {
    const uid = await this.odoo.authenticate();
    const hoy = getFechaColombiaHoy();

    const startDay = dto.soloHoy ? hoy : dto.startDate;
    const endDay = dto.soloHoy ? hoy : dto.endDate;

    const inicioUTC = startDay ? `${startDay} 05:00:00` : null;
    // finUTCAtt: límite conservador para hr.attendance (check_in hasta 04:59:59 del día siguiente)
    // finUTCLog: límite extendido para attendance.log (captura salidas de turno nocturno ≈06:00 col)
    let finUTCAtt: string | null = null;
    let finUTCLog: string | null = null;
    if (endDay) {
      const [a, m, d] = endDay.split('-').map(Number);
      const fd = new Date(a, m - 1, d);
      fd.setDate(fd.getDate() + 1);
      const base = `${fd.getFullYear()}-${String(fd.getMonth() + 1).padStart(2, '0')}-${String(fd.getDate()).padStart(2, '0')}`;
      finUTCAtt = `${base} 04:59:59`;
      finUTCLog = `${base} 11:59:59`;
    }

    const idsPorEstructura = await this.resolverIdsPorEstructura(
      dto.area_id,
      dto.segmento_id,
    );
    if (idsPorEstructura !== null && idsPorEstructura.length === 0) return [];

    // Dominio para hr.attendance
    const domainAtt: any[] = [];
    if (inicioUTC) domainAtt.push(['check_in', '>=', inicioUTC]);
    if (finUTCAtt) domainAtt.push(['check_in', '<=', finUTCAtt]);
    if (dto.company && dto.company !== 'Todas' && dto.company !== '') {
      domainAtt.push(['employee_id.company_id.name', '=', dto.company]);
    }
    if (idsPorEstructura && idsPorEstructura.length > 0) {
      domainAtt.push(['employee_id', 'in', idsPorEstructura]);
    }

    // Dominio para attendance.log (biométrico / app)
    // Usa finUTCLog extendido para capturar salidas de turno nocturno (≈06:00 Colombia = 11:00 UTC)
    const domainLog: any[] = [];
    if (inicioUTC) domainLog.push(['punching_time', '>=', inicioUTC]);
    if (finUTCLog) domainLog.push(['punching_time', '<=', finUTCLog]);
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

    // ── Cargar mallas ANTES de agrupar logs (necesario para detectar turnos nocturnos) ──
    // Recopilar IDs de empleados de ambas fuentes para la carga anticipada
    const allEmpIdsEarly = new Set<number>();
    for (const att of attendances) { if (att.employee_id?.[0]) allEmpIdsEarly.add(att.employee_id[0]); }
    for (const log of logs) { if (log.employee_id?.[0]) allEmpIdsEarly.add(log.employee_id[0]); }
    const mallasMapEarly = await this.getMallasMap([...allEmpIdsEarly]);

    // Helpers disponibles en todo el método
    const getTurnoParaFecha = (empId: number, fecha: string): any | null => {
      const asigs = mallasMapEarly.get(empId) ?? [];
      const det = this.resolverDetallesParaFecha(asigs, fecha);
      const dia = this.getDiaSemana(fecha);
      return det
        .filter((d: any) => Number(d.dia_semana) === dia)
        .sort((a: any, b: any) => Number(a.hora_inicio) - Number(b.hora_inicio))[0] ?? null;
    };
    const esNocturnoTurno = (t: any | null): boolean =>
      t !== null && Number(t.hora_fin) < Number(t.hora_inicio);
    const addUnDia = (fecha: string): string => {
      const [a, m, d] = fecha.split('-').map(Number);
      const dt = new Date(a, m - 1, d + 1);
      return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    };

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

    // ── Agrupar attendance.log con conciencia de turnos nocturnos ─────────────
    const idsPermitidos = idsPorEstructura ? new Set(idsPorEstructura) : null;

    // Recopilar TODOS los punches biométricos por empleado, ordenados cronológicamente
    const allLogsByEmp = new Map<number, { localTime: string; rawTime: string; log: any }[]>();
    for (const log of logs) {
      const empId = log.employee_id?.[0];
      if (!empId) continue;
      if (idsPermitidos && !idsPermitidos.has(empId)) continue;
      const localTime = this.toLocal(log.punching_time);
      if (!localTime) continue;
      const list = allLogsByEmp.get(empId) ?? [];
      list.push({ localTime, rawTime: log.punching_time, log });
      allLogsByEmp.set(empId, list);
    }
    for (const [, punches] of allLogsByEmp) {
      punches.sort((a, b) => a.rawTime.localeCompare(b.rawTime));
    }

    // Agrupar biométrico: turno nocturno → empareja entrada(día N) con salida(día N+1)
    const processedSalidaKeys = new Set<string>(); // keys ya consumidos como salida nocturna

    for (const [empId, punches] of allLogsByEmp) {
      const fechasConPunch = [...new Set(punches.map(p => p.localTime.split(' ')[0]))].sort();

      for (const fecha of fechasConPunch) {
        const key = `${empId}_${fecha}`;
        if (grupos[key]) continue; // ya cubierto por hr.attendance

        const turno = getTurnoParaFecha(empId, fecha);

        // Si este día fue marcado como "salida" del turno nocturno anterior,
        // solo lo saltamos si el turno NO es nocturno (punch matutino aislado, nada más).
        // Si ES nocturno, puede tener su propia entrada vespertina → seguimos procesando.
        if (processedSalidaKeys.has(key) && !esNocturnoTurno(turno)) continue;

        if (esNocturnoTurno(turno)) {
          // Turno nocturno: entrada ≈ hora_inicio en `fecha`, salida ≈ hora_fin en `fecha+1`
          const inicioMins = Number(turno.hora_inicio) * 60;
          const finMins    = Number(turno.hora_fin)    * 60;
          const siguiente  = addUnDia(fecha);

          const entrada = punches.find(p =>
            p.localTime.split(' ')[0] === fecha &&
            Math.abs(this.parseMinutos(p.localTime) - inicioMins) <= 180,
          );
          const salida = punches.find(p =>
            p.localTime.split(' ')[0] === siguiente &&
            Math.abs(this.parseMinutos(p.localTime) - finMins) <= 180,
          );

          if (!entrada) continue; // Sin entrada biométrica → ignorar este día

          const keySig = `${empId}_${siguiente}`;
          // Marcar el día siguiente como "consumido" como salida de este turno
          if (salida && !grupos[keySig]) processedSalidaKeys.add(keySig);

          const nombre = entrada.log.employee_id?.[1] || 'Desconocido';
          const dept   = entrada.log.x_studio_related_field_j40wn?.[1] || 'SIN DEPTO';

          grupos[key] = {
            empId, nombre, dept, fecha,
            records: [{
              employee_id: [empId, nombre],
              check_in:  entrada.rawTime,
              check_out: salida?.rawTime ?? null,
              department_id: null,
            }],
          };
        } else {
          // Turno diurno o sin turno: tomar todos los punches del día
          const dayPunches = punches.filter(p => p.localTime.split(' ')[0] === fecha);
          if (!dayPunches.length) continue;

          const primero   = dayPunches[0];
          const ultimoDay = dayPunches[dayPunches.length - 1];
          const haySalida =
            dayPunches.length > 1 &&
            new Date(ultimoDay.rawTime).getTime() - new Date(primero.rawTime).getTime() >= 60_000;

          const nombre = primero.log.employee_id?.[1] || 'Desconocido';
          const dept   = primero.log.x_studio_related_field_j40wn?.[1] || 'SIN DEPTO';

          grupos[key] = {
            empId, nombre, dept, fecha,
            records: [{
              employee_id: [empId, nombre],
              check_in:  primero.rawTime,
              check_out: haySalida ? ultimoDay.rawTime : null,
              department_id: null,
            }],
          };
        }
      }
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

    // Mallas ya cargadas anticipadamente en mallasMapEarly; reutilizar como mallasMap
    const mallasMap = mallasMapEarly;

    // Festivos colombianos para el rango consultado
    const festivosSet = buildFestivosSet(startDay, endDay);

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

      // ── Determinar turno primero (necesario para la lógica nocturna) ─────────
      const asignaciones = mallasMap.get(empId) ?? [];
      // sinMalla: el registro se muestra igual, pero no se calculan horas extra
      const sinMalla = asignaciones.length === 0;

      const diaSemana = this.getDiaSemana(fecha);
      const esDominical = diaSemana === 6;
      const esFestivo   = esDominical || festivosSet.has(fecha);

      // Tipo del día siguiente (para partir correctamente los turnos nocturnos
      // que cruzan medianoche: las horas del día N+1 usan el tipo de ese día)
      const fechaSiguiente       = addUnDia(fecha);
      const diaSemSiguiente      = this.getDiaSemana(fechaSiguiente);
      const esFestivoSiguiente   = diaSemSiguiente === 6 || festivosSet.has(fechaSiguiente);

      // Resolver turno solo si tiene malla asignada
      let turno: any = null;
      if (!sinMalla) {
        const detalles = this.resolverDetallesParaFecha(asignaciones, fecha);
        const turnoDetalles = detalles
          .filter((d: any) => Number(d.dia_semana) === diaSemana)
          .sort(
            (a: any, b: any) => Number(a.hora_inicio) - Number(b.hora_inicio),
          );
        turno = turnoDetalles[0] ?? null;
      }
      // NOTA: ya no se hace `continue` por falta de malla ni por día sin turno.
      // El registro siempre se incluye; las horas extra se calculan solo cuando corresponde.

      // ── Entrada / salida desde hr.attendance (o biométrico sintético) ────────
      let localIn = this.toLocal(primero.check_in);
      let localOut: string | null = ultimoConSalida
        ? this.toLocal(ultimoConSalida.check_out)
        : null;

      // ── Turnos nocturnos: corregir con biométrico real ────────────────────────
      // hr.attendance puede tener entrada/salida mal asignadas para turnos que cruzan
      // medianoche (ej. registra 04:59→22:09 en vez de 22:09→05:00).
      // La fuente de verdad para nocturnos es el biométrico: entrada ≈ hora_inicio
      // en `fecha` y salida ≈ hora_fin en `fecha+1`.
      if (turno && esNocturnoTurno(turno) && allLogsByEmp.has(empId)) {
        const inicioMins = Number(turno.hora_inicio) * 60;
        const finMins    = Number(turno.hora_fin)    * 60;
        const siguiente  = addUnDia(fecha);
        const punches    = allLogsByEmp.get(empId)!;

        const entradaBio = punches.find(p =>
          p.localTime.split(' ')[0] === fecha &&
          Math.abs(this.parseMinutos(p.localTime) - inicioMins) <= 180,
        );
        const salidaBio = punches.find(p =>
          p.localTime.split(' ')[0] === siguiente &&
          Math.abs(this.parseMinutos(p.localTime) - finMins) <= 180,
        );

        if (entradaBio) {
          localIn = entradaBio.localTime;
          // Solo sobreescribir salida si el biométrico tiene la punch de salida;
          // de lo contrario conservar el check_out de hr.attendance (ya asignado arriba).
          if (salidaBio) localOut = salidaBio.localTime;
        }
      }

      // ── Fallback biométrico general ───────────────────────────────────────────
      // Si después de la corrección nocturna todavía no hay salida, intentar
      // reconstruirla desde attendance.log sin importar el tipo de turno.
      //
      //  1. Turno DIURNO (o sin turno): buscar la última punch del mismo día
      //     que sea al menos 10 minutos posterior a la entrada.
      //  2. Turno NOCTURNO sin malla / sin turno definido pero entrada ≥ 21:00:
      //     buscar la primera punch del día siguiente con hora ≤ 08:00.
      if (!localOut && localIn && allLogsByEmp.has(empId)) {
        const inFecha  = localIn.split(' ')[0];
        const inMins   = this.parseMinutos(localIn);
        const punches  = allLogsByEmp.get(empId)!;

        // 1. Misma fecha: última punch posterior a la entrada (≥ 10 min después)
        const salidaMismoDia = [...punches]
          .filter(p =>
            p.localTime.split(' ')[0] === inFecha &&
            this.parseMinutos(p.localTime) >= inMins + 10,
          )
          .at(-1); // la más tardía del día

        if (salidaMismoDia) {
          localOut = salidaMismoDia.localTime;
        } else if (inMins >= 1260) {
          // 2. Entrada nocturna (≥ 21:00) sin salida ese día → buscar en día siguiente
          const siguiente    = addUnDia(inFecha);
          const salidaSigDia = punches.find(p =>
            p.localTime.split(' ')[0] === siguiente &&
            this.parseMinutos(p.localTime) <= 480, // ≤ 08:00
          );
          if (salidaSigDia) localOut = salidaSigDia.localTime;
        }
      }

      // Sin salida registrada → no se puede calcular horas extras
      if (!localOut) continue;

      const cedula = cedulaMap.get(empId) ?? 'N/A';

      // Cargo: primero Odoo, fallback local
      const cargo =
        cargoOdooMap.get(empId) || cargoLocalMap.get(cedula) || null;

      // Siempre calcular si hay entrada y salida:
      //  - Con turno → RN dentro del turno + HEDO/HENO/HEFD/HEFN extras
      //  - Sin turno en festivo/domingo → HEFD/HEFN (todo el tiempo trabajado es extra festivo)
      //  - Sin turno en día ordinario (incl. sábado sin malla) → HEDO/HENO (todo es extra ordinario)
      // Reposición por llegada tardía: si entró más de TOLERANCIA minutos después
      // del inicio del turno, debe reponer ese tiempo al final antes de contar extras.
      // Tolerancia = 6 min (llegar hasta 6 min tarde se acepta sin reposición).
      const TOLERANCIA_REPOS = HorasExtraService.TOLERANCIA_MINS;
      let retrasoMins = 0;
      if (turno && localIn) {
        const shiftStartMins = Number(turno.hora_inicio) * 60;
        const inMinsLocal    = this.parseMinutos(localIn);
        if (inMinsLocal > shiftStartMins + TOLERANCIA_REPOS) {
          retrasoMins = inMinsLocal - shiftStartMins;
        }
      }

      const debeCalcularExtras = true;
      const categorias = debeCalcularExtras
        ? this.calcularCategorias(localIn, localOut, turno, esFestivo, esFestivoSiguiente, retrasoMins)
        : { rn: 0, rndf: 0, rddf: 0, hedo: 0, heno: 0, hefd: 0, hefn: 0 };

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
        es_dominical: esFestivo,
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

    // Filtro por estructura (área/segmento) → OR entre ambos criterios
    if (filters.area_id || filters.segmento_id) {
      const conditions: any[] = [];
      if (filters.area_id) conditions.push({ area_id: filters.area_id });
      if (filters.segmento_id) conditions.push({ segmento_id: filters.segmento_id });
      const usuarios = await this.usuarioRepo.find({
        where: conditions,
        select: ['identificacion'],
      });
      const cedulas = [...new Set(
        usuarios.map((u) => u.identificacion).filter(Boolean),
      )];
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
    observacion?: string,
  ): Promise<HoraExtra | null> {
    // Bloquear aprobación si hay horas extra sin justificación (actividad)
    if (aprobado === true) {
      const reg = await this.horaExtraRepo.findOne({ where: { id } });
      if (reg) {
        // Solo exigir justificación cuando los extras suman >= 0.5h (30 min)
        const totalExtras =
          Number(reg.hedo) + Number(reg.heno) +
          Number(reg.hefd) + Number(reg.hefn);
        const tieneExtras = totalExtras >= 0.5;
        if (tieneExtras && !reg.actividad?.trim()) {
          throw new Error(
            'ACTIVIDAD_REQUERIDA: Este registro tiene horas extra sin justificación. Agrega una actividad antes de aprobar.',
          );
        }
      }
    }
    await this.horaExtraRepo.update(id, { aprobado, observacion: observacion ?? null });
    return this.horaExtraRepo.findOne({ where: { id } });
  }

  async actualizarActividad(id: number, actividad: string): Promise<HoraExtra | null> {
    await this.horaExtraRepo.update(id, { actividad: actividad?.trim() || null });
    return this.horaExtraRepo.findOne({ where: { id } });
  }

  async actualizarHoras(
    id: number,
    horas: { rn?: number; rndf?: number; rddf?: number; hedo?: number; heno?: number; hefd?: number; hefn?: number },
  ): Promise<HoraExtra | null> {
    const campos: Partial<HoraExtra> = {};
    const validos = ['rn', 'rndf', 'rddf', 'hedo', 'heno', 'hefd', 'hefn'] as const;
    for (const campo of validos) {
      if (horas[campo] !== undefined) {
        campos[campo] = Math.max(0, Number(horas[campo]));
      }
    }
    if (!Object.keys(campos).length) return this.horaExtraRepo.findOne({ where: { id } });
    await this.horaExtraRepo.update(id, campos);
    return this.horaExtraRepo.findOne({ where: { id } });
  }

  async notificarAprobados(registros: any[]): Promise<{ enviado: boolean }> {
    if (!registros.length) return { enviado: false };
    const excelBuffer = await this._generarExcelDesdeRegistros(registros);
    await this.mail.enviarNovedadesAprobadas({ registros, excelBuffer });
    return { enviado: true };
  }

  async guardarSeleccionados(
    registros: any[],
    calculado_por: string,
  ): Promise<{ guardados: number }> {
    if (!registros.length) return { guardados: 0 };

    // Borrar solo los pares cedula+fecha que vienen en la lista
    for (const r of registros) {
      if (r.cedula && r.fecha) {
        await this.horaExtraRepo.delete({ cedula: r.cedula, fecha: r.fecha });
      }
    }

    const entities = registros.map((r) =>
      this.horaExtraRepo.create({
        cedula: r.cedula,
        nombre: r.nombre,
        employee_id_odoo: r.employee_id_odoo ?? null,
        fecha: r.fecha,
        company: r.company ?? null,
        departamento: r.departamento ?? null,
        inicio_turno: r.inicio_turno ?? null,
        fin_turno: r.fin_turno ?? null,
        fecha_entrada: r.fecha_entrada ?? null,
        fecha_salida: r.fecha_salida ?? null,
        rn: r.rn ?? 0,
        rndf: r.rndf ?? 0,
        rddf: r.rddf ?? 0,
        hedo: r.hedo ?? 0,
        heno: r.heno ?? 0,
        hefd: r.hefd ?? 0,
        hefn: r.hefn ?? 0,
        es_dominical: r.es_dominical ?? false,
        cargo: r.cargo ?? null,
        calculado_por,
        aprobado: r.aprobado ?? null,
        observacion: r.observacion ?? null,
        total_minutos_extra: r.total_minutos_extra ?? 0,
      }),
    );

    const CHUNK = 50;
    for (let i = 0; i < entities.length; i += CHUNK) {
      await this.horaExtraRepo.save(entities.slice(i, i + CHUNK));
    }

    return { guardados: entities.length };
  }

  async getNovedadesAprobadas(filters: {
    startDate?: string;
    endDate?: string;
    company?: string;
    departamento?: string;
    area_id?: number;
    segmento_id?: number;
  }): Promise<HoraExtra[]> {
    const qb = this.horaExtraRepo
      .createQueryBuilder('h')
      .where('h.aprobado = 1')   // bit=1 en SQL Server (no usar :param boolean aquí)
      .orderBy('h.nombre', 'ASC')
      .addOrderBy('h.fecha', 'ASC');

    if (filters.startDate)
      qb.andWhere('h.fecha >= :start', { start: filters.startDate });
    if (filters.endDate)
      qb.andWhere('h.fecha <= :end', { end: filters.endDate });
    if (filters.company && filters.company !== 'Todas')
      qb.andWhere('h.company = :company', { company: filters.company });
    if (filters.departamento)
      qb.andWhere('h.departamento = :dep', { dep: filters.departamento });

    if (filters.area_id || filters.segmento_id) {
      const ids = await this.resolverIdsPorEstructura(
        filters.area_id,
        filters.segmento_id,
      );
      if (ids && ids.length) {
        qb.andWhere('h.employee_id_odoo IN (:...ids)', { ids: ids.slice(0, 500) });
      }
    }

    return qb.getMany();
  }

  async exportarCalculado(registros: any[]): Promise<Buffer> {
    return this._generarExcelDesdeRegistros(registros);
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
    return this._generarExcelDesdeRegistros(registros);
  }

  private async _generarExcelDesdeRegistros(registros: any[]): Promise<Buffer> {

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
    const empresas = new Map<string, Map<string, any[]>>();
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
          const horaEntrada = r.hora_inicio_laborado
            ? r.hora_inicio_laborado.slice(0, 5)
            : r.fecha_entrada
              ? (r.fecha_entrada.split(' ')[1]?.slice(0, 5) ?? '')
              : '';
          const horaSalida = r.hora_fin_laborado
            ? r.hora_fin_laborado.slice(0, 5)
            : r.fecha_salida
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
      'RN = Recargo Nocturno: Dentro de la jornada laboral de 19:00 Hr a 6:00 Hr',
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

  async eliminarRegistro(id: number): Promise<void> {
    await this.horaExtraRepo.delete(id);
  }
}
