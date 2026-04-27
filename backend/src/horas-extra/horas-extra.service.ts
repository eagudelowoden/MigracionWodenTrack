import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HoraExtra } from './entities/hora-extra.entity';
import { MallaAsignacion } from '../mallas/entities/malla-asignacion.entity';
import { OdooService } from '../odoo/odoo.service';

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
}

@Injectable()
export class HorasExtraService {
  constructor(
    @InjectRepository(HoraExtra)
    private readonly horaExtraRepo: Repository<HoraExtra>,
    @InjectRepository(MallaAsignacion)
    private readonly asignacionRepo: Repository<MallaAsignacion>,
    private readonly odoo: OdooService,
  ) {}

  // UTC string de Odoo → hora Colombia local "YYYY-MM-DD HH:MM:SS"
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

  // Decimal 7.5 → "07:30"
  private decimalToHora(decimal: number): string {
    const h = Math.floor(decimal);
    const m = Math.round((decimal - h) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  // "YYYY-MM-DD HH:MM:SS" → minutos del día (evita problemas de zona horaria)
  private parseMinutos(datetimeStr: string): number {
    const timePart = datetimeStr.includes(' ')
      ? datetimeStr.split(' ')[1]
      : datetimeStr;
    const [h, m, s] = timePart.split(':').map(Number);
    return h * 60 + m + (s || 0) / 60;
  }

  // Malla map: Map<employee_id_odoo, MallaAsignacion[]> ordenadas DESC
  private async getMallasMap(
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

    const map = new Map<number, any[]>();
    for (const a of asignaciones) {
      const list = map.get(a.usuario_id_odoo) ?? [];
      list.push(a);
      map.set(a.usuario_id_odoo, list);
    }
    return map;
  }

  // Detalles (días/horas) de malla vigente para una fecha local
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

  // Día de semana Colombia: 0=Lun...6=Dom
  private getDiaSemana(fechaYYYYMMDD: string): number {
    const [a, m, d] = fechaYYYYMMDD.split('-').map(Number);
    const js = new Date(a, m - 1, d).getDay(); // 0=Dom,1=Lun...6=Sáb
    return js === 0 ? 6 : js - 1; // 0=Lun,6=Dom
  }

  async calcularExtras(dto: CalcularExtrasDto): Promise<HoraExtra[]> {
    const uid = await this.odoo.authenticate();
    const hoy = getFechaColombiaHoy();

    const startDay = dto.soloHoy ? hoy : dto.startDate;
    const endDay = dto.soloHoy ? hoy : dto.endDate;

    // Rango UTC (Colombia UTC-5: día empieza a las 05:00 UTC)
    const inicioUTC = startDay ? `${startDay} 05:00:00` : null;
    let finUTC: string | null = null;
    if (endDay) {
      const [a, m, d] = endDay.split('-').map(Number);
      const fd = new Date(a, m - 1, d);
      fd.setDate(fd.getDate() + 1);
      finUTC = `${fd.getFullYear()}-${String(fd.getMonth() + 1).padStart(2, '0')}-${String(fd.getDate()).padStart(2, '0')} 04:59:59`;
    }

    // Dominio Odoo
    const domain: any[] = [];
    if (inicioUTC) domain.push(['check_in', '>=', inicioUTC]);
    if (finUTC) domain.push(['check_in', '<=', finUTC]);
    if (dto.company && dto.company !== 'Todas' && dto.company !== '') {
      domain.push(['employee_id.company_id.name', '=', dto.company]);
    }

    // Consulta Odoo asistencias
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

    // Cédulas
    const empIds = [
      ...new Set(
        attendances.map((a) => a.employee_id?.[0]).filter(Boolean),
      ),
    ] as number[];

    const empleados = await this.odoo.executeKw<any[]>(
      'hr.employee',
      'search_read',
      [[['id', 'in', empIds]]],
      { fields: ['id', 'name', 'identification_id', 'barcode'] },
      uid,
    );

    const cedulaMap = new Map<number, string>();
    empleados.forEach((e) => {
      cedulaMap.set(e.id, e.identification_id || e.barcode || 'N/A');
    });

    // Mallas
    const mallasMap = await this.getMallasMap(empIds);

    // Agrupar asistencias por empleado + día Colombia
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

    // Calcular horas extra por grupo
    const resultados: HoraExtra[] = [];

    for (const g of Object.values(grupos)) {
      const { empId, nombre, dept, fecha, records } = g;

      // Primera entrada del día y última salida válida
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

      // Malla vigente ese día
      const asignaciones = mallasMap.get(empId) ?? [];
      const detalles = this.resolverDetallesParaFecha(asignaciones, fecha);
      const diaSemana = this.getDiaSemana(fecha);
      const turnoDetalles = detalles
        .filter((d: any) => Number(d.dia_semana) === diaSemana)
        .sort((a: any, b: any) => Number(a.hora_inicio) - Number(b.hora_inicio));

      const turno = turnoDetalles[0] ?? null;
      const cedula = cedulaMap.get(empId) ?? 'N/A';

      const registro = this.horaExtraRepo.create({
        cedula,
        nombre,
        employee_id_odoo: empId,
        fecha,
        company: dto.company ?? null,
        departamento: dept,
        fecha_entrada: localIn,
        fecha_salida: localOut,
        calculado_por: dto.calculado_por ?? null,
        inicio_turno: null,
        fin_turno: null,
        inicio_extra_entrada: null,
        fin_extra_entrada: null,
        minutos_extra_entrada: 0,
        inicio_extra_salida: null,
        fin_extra_salida: null,
        minutos_extra_salida: 0,
        total_minutos_extra: 0,
      });

      if (turno) {
        const horaInDecimal = Number(turno.hora_inicio);
        const horaFinDecimal = Number(turno.hora_fin);
        registro.inicio_turno = this.decimalToHora(horaInDecimal);
        registro.fin_turno = this.decimalToHora(horaFinDecimal);

        const shiftStartMins = horaInDecimal * 60;
        const shiftEndMins = horaFinDecimal * 60;

        // Extra por entrada anticipada (umbral: 60 min antes del turno)
        if (localIn) {
          const entradaMins = this.parseMinutos(localIn);
          const minsBefore = shiftStartMins - entradaMins;
          if (minsBefore >= 60) {
            registro.inicio_extra_entrada = localIn;
            registro.fin_extra_entrada = `${fecha} ${this.decimalToHora(horaInDecimal)}:00`;
            registro.minutos_extra_entrada = Math.round(minsBefore);
          }
        }

        // Extra por salida tardía (umbral: 60 min después del turno)
        if (localOut) {
          const salidaMins = this.parseMinutos(localOut);
          const minsAfter = salidaMins - shiftEndMins;
          if (minsAfter >= 60) {
            registro.inicio_extra_salida = `${fecha} ${this.decimalToHora(horaFinDecimal)}:00`;
            registro.fin_extra_salida = localOut;
            registro.minutos_extra_salida = Math.round(minsAfter);
          }
        }
      }

      registro.total_minutos_extra =
        registro.minutos_extra_entrada + registro.minutos_extra_salida;

      resultados.push(registro);
    }

    // Borrar cálculos anteriores del mismo rango + compañía y guardar los nuevos
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

    if (resultados.length > 0) {
      await this.horaExtraRepo.save(resultados);
    }

    return resultados;
  }

  async getHistorial(filters: {
    startDate?: string;
    endDate?: string;
    company?: string;
    cedula?: string;
    soloConExtras?: boolean;
  }): Promise<HoraExtra[]> {
    const qb = this.horaExtraRepo
      .createQueryBuilder('h')
      .orderBy('h.fecha', 'DESC')
      .addOrderBy('h.nombre', 'ASC');

    if (filters.startDate)
      qb.andWhere('h.fecha >= :start', { start: filters.startDate });
    if (filters.endDate)
      qb.andWhere('h.fecha <= :end', { end: filters.endDate });
    if (filters.company && filters.company !== 'Todas')
      qb.andWhere('h.company = :company', { company: filters.company });
    if (filters.cedula)
      qb.andWhere('h.cedula LIKE :cedula', { cedula: `%${filters.cedula}%` });
    if (filters.soloConExtras)
      qb.andWhere('h.total_minutos_extra > 0');

    return qb.getMany();
  }
}
