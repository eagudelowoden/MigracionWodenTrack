import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsuariosService } from '../usuarios/usuarios.service';
import { AsistenciaDiariaResumen } from './entities/asistencia-diaria-resumen.entity';
import { HoraExtra } from '../horas-extra/entities/hora-extra.entity';

/**
 * Lee `asistencia_diaria_resumen` (poblada por el cron/worker nocturno —
 * ver `AsistenciaResumenService`). Ya NO llama a Odoo en vivo: son
 * agregaciones SQL simples, por eso no hay límite de días ni `@Pesado()`.
 * Los métodos existentes mantienen el mismo contrato de respuesta hacia el
 * frontend; los nuevos son los que pide el dashboard ampliado.
 */
@Injectable()
export class DashboardAsistenciaService {
  constructor(
    private readonly usuariosService: UsuariosService,
    @InjectRepository(AsistenciaDiariaResumen)
    private readonly resumenRepo: Repository<AsistenciaDiariaResumen>,
    @InjectRepository(HoraExtra)
    private readonly horaExtraRepo: Repository<HoraExtra>,
  ) {}

  private validarRango(startDate?: string, endDate?: string) {
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate y endDate son requeridos (formato YYYY-MM-DD)');
    }
    if (new Date(startDate) > new Date(endDate)) {
      throw new BadRequestException('startDate debe ser anterior a endDate');
    }
  }

  /** Base query: rango de fechas + filtros opcionales, excluyendo NO_PROGRAMADO. */
  private baseQuery(startDate: string, endDate: string, departamento?: string, company?: string) {
    const qb = this.resumenRepo
      .createQueryBuilder('r')
      .where('r.fecha BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('r.estado != :noProg', { noProg: 'NO_PROGRAMADO' });
    if (departamento) qb.andWhere('r.departamento = :departamento', { departamento });
    if (company) qb.andWhere('r.company = :company', { company });
    return qb;
  }

  private mapEstado(estado: string): string {
    if (estado === 'TARDE') return 'ENTRADA TARDE';
    if (estado === 'PUNTUAL') return 'A TIEMPO';
    return estado; // AUSENTE / INCOMPLETO
  }

  async rankingTardanzas(startDate: string, endDate: string, departamento?: string, company?: string) {
    this.validarRango(startDate, endDate);
    const filas = await this.baseQuery(startDate, endDate, departamento, company)
      .andWhere('r.estado = :tarde', { tarde: 'TARDE' })
      .select('r.cedula', 'cedula')
      .addSelect('r.nombre', 'nombre')
      .addSelect('r.departamento', 'departamento')
      .addSelect('COUNT(*)', 'total_tardanzas')
      .groupBy('r.cedula, r.nombre, r.departamento')
      .getRawMany();

    const ranking = filas
      .map((f) => ({
        cedula: f.cedula,
        nombre: f.nombre,
        departamento: f.departamento,
        total_tardanzas: Number(f.total_tardanzas),
      }))
      .sort((a, b) => b.total_tardanzas - a.total_tardanzas);

    return { startDate, endDate, departamento: departamento ?? null, ranking };
  }

  async cumplimientoPorArea(startDate: string, endDate: string, company?: string) {
    this.validarRango(startDate, endDate);

    const porAreaRaw = await this.baseQuery(startDate, endDate, undefined, company)
      .select('r.departamento', 'departamento')
      .addSelect('COUNT(*)', 'total_registros')
      .addSelect('SUM(CASE WHEN r.estado = :tarde THEN 1 ELSE 0 END)', 'total_tardanzas')
      .setParameter('tarde', 'TARDE')
      .groupBy('r.departamento')
      .getRawMany();

    const porEmpleadoRaw = await this.baseQuery(startDate, endDate, undefined, company)
      .select('r.departamento', 'departamento')
      .addSelect('r.cedula', 'cedula')
      .addSelect('r.nombre', 'nombre')
      .addSelect('SUM(CASE WHEN r.estado = :tarde THEN 1 ELSE 0 END)', 'total_tardanzas')
      .addSelect('SUM(CASE WHEN r.estado = :puntual THEN 1 ELSE 0 END)', 'dias_a_tiempo')
      .setParameter('tarde', 'TARDE')
      .setParameter('puntual', 'PUNTUAL')
      .groupBy('r.departamento, r.cedula, r.nombre')
      .getRawMany();

    const peorPorArea = new Map<string, { nombre: string; total_tardanzas: number }>();
    const mejorPorArea = new Map<string, { nombre: string; dias_a_tiempo: number }>();
    for (const e of porEmpleadoRaw) {
      const dept = e.departamento;
      const tard = Number(e.total_tardanzas);
      const puntual = Number(e.dias_a_tiempo);
      const peorActual = peorPorArea.get(dept);
      if (tard > 0 && (!peorActual || tard > peorActual.total_tardanzas)) {
        peorPorArea.set(dept, { nombre: e.nombre, total_tardanzas: tard });
      }
      const mejorActual = mejorPorArea.get(dept);
      if (tard === 0 && (!mejorActual || puntual > mejorActual.dias_a_tiempo)) {
        mejorPorArea.set(dept, { nombre: e.nombre, dias_a_tiempo: puntual });
      }
    }

    const areas = porAreaRaw
      .map((a) => {
        const total_registros = Number(a.total_registros);
        const total_tardanzas = Number(a.total_tardanzas);
        return {
          departamento: a.departamento,
          total_registros,
          total_tardanzas,
          porcentaje_cumplimiento:
            total_registros > 0 ? Math.round((100 - (total_tardanzas / total_registros) * 100) * 100) / 100 : 100,
          peor_empleado: peorPorArea.get(a.departamento)?.nombre ?? null,
          mejor_empleado: mejorPorArea.get(a.departamento)?.nombre ?? null,
        };
      })
      .sort((a, b) => b.porcentaje_cumplimiento - a.porcentaje_cumplimiento);

    return { startDate, endDate, areas };
  }

  /** Detalle de un solo día: quién llegó, a qué hora, y si llegó tarde. */
  async detalleDia(fecha: string, departamento?: string, company?: string) {
    if (!fecha) throw new BadRequestException('fecha es requerida (formato YYYY-MM-DD)');
    const filas = await this.baseQuery(fecha, fecha, departamento, company).getMany();

    const registros = filas
      .map((f) => ({
        cedula: f.cedula,
        nombre: f.nombre,
        departamento: f.departamento,
        entrada: f.hora_entrada ? f.hora_entrada.split(' ')[1]?.slice(0, 5) ?? null : null,
        salida: f.hora_salida ? f.hora_salida.split(' ')[1]?.slice(0, 5) ?? null : null,
        estado: this.mapEstado(f.estado),
      }))
      .sort((a, b) => (a.estado === 'ENTRADA TARDE' ? -1 : 1) - (b.estado === 'ENTRADA TARDE' ? -1 : 1));

    return { fecha, departamento: departamento ?? null, registros };
  }

  async tendenciaMensual(startDate: string, endDate: string, departamento?: string, company?: string) {
    this.validarRango(startDate, endDate);

    const raw = await this.baseQuery(startDate, endDate, departamento, company)
      .select("FORMAT(r.fecha, 'yyyy-MM')", 'mes')
      .addSelect('COUNT(*)', 'total_registros')
      .addSelect('SUM(CASE WHEN r.estado = :tarde THEN 1 ELSE 0 END)', 'total_tardanzas')
      .setParameter('tarde', 'TARDE')
      .groupBy("FORMAT(r.fecha, 'yyyy-MM')")
      .orderBy("FORMAT(r.fecha, 'yyyy-MM')", 'ASC')
      .getRawMany();

    const serie = raw.map((m) => {
      const total = Number(m.total_registros);
      const tardanzas = Number(m.total_tardanzas);
      return {
        mes: m.mes,
        total_registros: total,
        total_tardanzas: tardanzas,
        porcentaje_cumplimiento: total > 0 ? Math.round((100 - (tardanzas / total) * 100) * 100) / 100 : 100,
      };
    });

    return { serie };
  }

  async departamentos(company?: string): Promise<{ departamentos: string[] }> {
    const departamentos = await this.usuariosService.getDepartamentosMalla(company);
    return { departamentos };
  }

  // ── Nuevos: dashboard ampliado ────────────────────────────────────────────

  /** Dona: cuántos días-persona cayeron en cada estado. */
  async estadoAsistencia(startDate: string, endDate: string, departamento?: string, company?: string) {
    this.validarRango(startDate, endDate);
    const raw = await this.baseQuery(startDate, endDate, departamento, company)
      .select('r.estado', 'estado')
      .addSelect('COUNT(*)', 'total')
      .groupBy('r.estado')
      .getRawMany();
    return {
      startDate,
      endDate,
      estados: raw.map((r) => ({ estado: r.estado, total: Number(r.total) })),
    };
  }

  async tardanzasPorArea(startDate: string, endDate: string, company?: string) {
    this.validarRango(startDate, endDate);
    const raw = await this.baseQuery(startDate, endDate, undefined, company)
      .andWhere('r.estado = :tarde', { tarde: 'TARDE' })
      .select('r.departamento', 'departamento')
      .addSelect('COUNT(*)', 'total_tardanzas')
      .groupBy('r.departamento')
      .orderBy('total_tardanzas', 'DESC')
      .getRawMany();
    return { startDate, endDate, areas: raw.map((r) => ({ departamento: r.departamento, total_tardanzas: Number(r.total_tardanzas) })) };
  }

  async tardanzasPorDia(startDate: string, endDate: string, departamento?: string, company?: string) {
    this.validarRango(startDate, endDate);
    const raw = await this.baseQuery(startDate, endDate, departamento, company)
      .andWhere('r.estado = :tarde', { tarde: 'TARDE' })
      .select('CONVERT(varchar, r.fecha, 23)', 'fecha')
      .addSelect('COUNT(*)', 'total_tardanzas')
      .groupBy('r.fecha')
      .orderBy('r.fecha', 'ASC')
      .getRawMany();
    return { startDate, endDate, dias: raw.map((r) => ({ fecha: r.fecha, total_tardanzas: Number(r.total_tardanzas) })) };
  }

  /** Distribución de minutos de tardanza en buckets. */
  async distribucionMinutosTardanza(startDate: string, endDate: string, departamento?: string, company?: string) {
    this.validarRango(startDate, endDate);
    const filas = await this.baseQuery(startDate, endDate, departamento, company)
      .andWhere('r.estado = :tarde', { tarde: 'TARDE' })
      .select('r.minutos_tarde', 'minutos_tarde')
      .getRawMany();

    const buckets = [
      { rango: '0-5', min: 0, max: 5, total: 0 },
      { rango: '6-15', min: 6, max: 15, total: 0 },
      { rango: '16-30', min: 16, max: 30, total: 0 },
      { rango: '31-60', min: 31, max: 60, total: 0 },
      { rango: '+60', min: 61, max: Infinity, total: 0 },
    ];
    for (const f of filas) {
      const m = Number(f.minutos_tarde ?? 0);
      const b = buckets.find((b) => m >= b.min && m <= b.max);
      if (b) b.total += 1;
    }
    return { startDate, endDate, buckets: buckets.map(({ rango, total }) => ({ rango, total })) };
  }

  /** Personas que requieren atención: 3+ tardanzas o alguna ausencia no justificada en el rango. */
  async personasAtencion(startDate: string, endDate: string, departamento?: string, company?: string) {
    this.validarRango(startDate, endDate);
    const raw = await this.baseQuery(startDate, endDate, departamento, company)
      .select('r.cedula', 'cedula')
      .addSelect('r.nombre', 'nombre')
      .addSelect('r.departamento', 'departamento')
      .addSelect('SUM(CASE WHEN r.estado = :tarde THEN 1 ELSE 0 END)', 'total_tardanzas')
      .addSelect(
        "SUM(CASE WHEN r.estado = 'AUSENTE' AND (r.ausencia_justificada IS NULL OR r.ausencia_justificada = 0) THEN 1 ELSE 0 END)",
        'ausencias_injustificadas',
      )
      .setParameter('tarde', 'TARDE')
      .groupBy('r.cedula, r.nombre, r.departamento')
      .having(
        "SUM(CASE WHEN r.estado = :tarde THEN 1 ELSE 0 END) >= 3 OR SUM(CASE WHEN r.estado = 'AUSENTE' AND (r.ausencia_justificada IS NULL OR r.ausencia_justificada = 0) THEN 1 ELSE 0 END) >= 1",
      )
      .getRawMany();

    const personas = raw
      .map((r) => ({
        cedula: r.cedula,
        nombre: r.nombre,
        departamento: r.departamento,
        total_tardanzas: Number(r.total_tardanzas),
        ausencias_injustificadas: Number(r.ausencias_injustificadas),
      }))
      .sort((a, b) => b.ausencias_injustificadas - a.ausencias_injustificadas || b.total_tardanzas - a.total_tardanzas);

    return { startDate, endDate, personas };
  }

  /** Personas más puntuales: 0 tardanzas y 0 ausencias, más días trabajados primero. */
  async personasPuntuales(startDate: string, endDate: string, departamento?: string, company?: string) {
    this.validarRango(startDate, endDate);
    const raw = await this.baseQuery(startDate, endDate, departamento, company)
      .select('r.cedula', 'cedula')
      .addSelect('r.nombre', 'nombre')
      .addSelect('r.departamento', 'departamento')
      .addSelect('COUNT(*)', 'total_dias')
      .addSelect('SUM(CASE WHEN r.estado = :puntual THEN 1 ELSE 0 END)', 'dias_a_tiempo')
      .setParameter('puntual', 'PUNTUAL')
      .groupBy('r.cedula, r.nombre, r.departamento')
      .having('COUNT(*) = SUM(CASE WHEN r.estado = :puntual THEN 1 ELSE 0 END)')
      .orderBy('total_dias', 'DESC')
      .limit(20)
      .getRawMany();

    return {
      startDate,
      endDate,
      personas: raw.map((r) => ({
        cedula: r.cedula,
        nombre: r.nombre,
        departamento: r.departamento,
        total_dias: Number(r.total_dias),
      })),
    };
  }

  /** Jornadas incompletas / calidad de marcaciones. */
  async calidadMarcaciones(startDate: string, endDate: string, departamento?: string, company?: string) {
    this.validarRango(startDate, endDate);
    const raw = await this.baseQuery(startDate, endDate, departamento, company)
      .select('r.departamento', 'departamento')
      .addSelect('COUNT(*)', 'total_registros')
      .addSelect("SUM(CASE WHEN r.estado = 'INCOMPLETO' THEN 1 ELSE 0 END)", 'total_incompletas')
      .groupBy('r.departamento')
      .getRawMany();

    return {
      startDate,
      endDate,
      areas: raw.map((r) => {
        const total = Number(r.total_registros);
        const incompletas = Number(r.total_incompletas);
        return {
          departamento: r.departamento,
          total_registros: total,
          total_incompletas: incompletas,
          porcentaje_incompletas: total > 0 ? Math.round((incompletas / total) * 10000) / 100 : 0,
        };
      }),
    };
  }

  /** Horas extra por área — solo LEE `horas_extra` (ya calculada por Gestión de Horas), no duplica su cálculo. */
  async horasExtraPorArea(startDate: string, endDate: string, company?: string) {
    this.validarRango(startDate, endDate);
    const qb = this.horaExtraRepo
      .createQueryBuilder('h')
      .where('h.fecha BETWEEN :startDate AND :endDate', { startDate, endDate })
      .select('h.departamento', 'departamento')
      .addSelect('SUM(h.total_minutos_extra)', 'total_minutos_extra')
      .groupBy('h.departamento')
      .orderBy('total_minutos_extra', 'DESC');
    if (company) qb.andWhere('h.company = :company', { company });
    const raw = await qb.getRawMany();
    return {
      startDate,
      endDate,
      areas: raw.map((r) => ({
        departamento: r.departamento,
        total_minutos_extra: Number(r.total_minutos_extra) || 0,
        total_horas_extra: Math.round(((Number(r.total_minutos_extra) || 0) / 60) * 100) / 100,
      })),
    };
  }
}
