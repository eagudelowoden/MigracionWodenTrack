import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsuariosService } from '../usuarios/usuarios.service';
import { AsistenciaDiariaResumen } from './entities/asistencia-diaria-resumen.entity';

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
  ) {}

  private validarRango(startDate?: string, endDate?: string) {
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate y endDate son requeridos (formato YYYY-MM-DD)');
    }
    if (new Date(startDate) > new Date(endDate)) {
      throw new BadRequestException('startDate debe ser anterior a endDate');
    }
  }

  /**
   * Base query: rango de fechas + filtros opcionales, excluyendo NO_PROGRAMADO.
   * `segmento` filtra por `r.segmento_nombre` — INDEPENDIENTE de `departamento`
   * (que sigue siendo el de Odoo): ambos pueden venir activos a la vez, es el
   * cruce de los dos. 'SIN SEGMENTO' es el valor que muestra el frontend para
   * las filas sin segmento asignado (el propio `cumplimientoPorArea` lo arma
   * con COALESCE) — nunca existe como string real en la columna, así que se
   * traduce a IS NULL en vez de una comparación literal.
   */
  private baseQuery(startDate: string, endDate: string, departamento?: string, company?: string, segmento?: string) {
    const qb = this.resumenRepo
      .createQueryBuilder('r')
      .where('r.fecha BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('r.estado != :noProg', { noProg: 'NO_PROGRAMADO' });
    if (departamento) qb.andWhere('r.departamento = :departamento', { departamento });
    if (company) qb.andWhere('r.company = :company', { company });
    if (segmento === 'SIN SEGMENTO') qb.andWhere('r.segmento_nombre IS NULL');
    else if (segmento) qb.andWhere('r.segmento_nombre = :segmento', { segmento });
    return qb;
  }

  private mapEstado(estado: string): string {
    if (estado === 'TARDE') return 'ENTRADA TARDE';
    if (estado === 'PUNTUAL') return 'A TIEMPO';
    return estado; // AUSENTE / INCOMPLETO
  }

  async rankingTardanzas(startDate: string, endDate: string, departamento?: string, company?: string, segmento?: string) {
    this.validarRango(startDate, endDate);
    const filas = await this.baseQuery(startDate, endDate, departamento, company, segmento)
      .andWhere('r.estado = :tarde', { tarde: 'TARDE' })
      .select('r.cedula', 'cedula')
      .addSelect('r.nombre', 'nombre')
      .addSelect('r.departamento', 'departamento')
      // CONVERT a 'YYYY-MM-DD' plano (mismo patrón que tardanzasPorDia/
      // ausenciasPorDia más abajo): sin esto, el driver de mssql devuelve la
      // columna `date` como objeto Date, que al serializarse a JSON sale como
      // ISO datetime ("2026-09-02T05:00:00.000Z") — y formatFechaISO en el
      // frontend, que espera 'YYYY-MM-DD', corta mal esa cadena.
      .addSelect('CONVERT(varchar, r.fecha, 23)', 'fecha')
      .addSelect('r.hora_entrada', 'hora_entrada')
      .addSelect('r.minutos_tarde', 'minutos_tarde')
      .orderBy('r.fecha', 'ASC')
      .getRawMany();

    const porCedula = new Map<string, { cedula: string; nombre: string; departamento: string; detalle: any[] }>();
    for (const f of filas) {
      let entry = porCedula.get(f.cedula);
      if (!entry) {
        entry = { cedula: f.cedula, nombre: f.nombre, departamento: f.departamento, detalle: [] };
        porCedula.set(f.cedula, entry);
      }
      entry.detalle.push({
        fecha: f.fecha,
        hora_entrada: f.hora_entrada,
        minutos_tarde: f.minutos_tarde != null ? Number(f.minutos_tarde) : null,
      });
    }

    const ranking = Array.from(porCedula.values())
      .map((e) => ({ ...e, total_tardanzas: e.detalle.length }))
      .sort((a, b) => b.total_tardanzas - a.total_tardanzas);

    return { startDate, endDate, departamento: departamento ?? null, ranking };
  }

  /**
   * Agrupa por SEGMENTO (maestro_segmentos, propio de esta app) en vez de
   * `departamento` (el que reporta Odoo) — a diferencia del resto de
   * endpoints "por área" de este servicio, que siguen usando `departamento`.
   * El filtro `departamento` recibido de la UI sigue aplicando tal cual (es
   * el dropdown Área/Departamento, que no cambia); solo lo que se AGRUPA y
   * se muestra como fila cambia de fuente. Se usa el alias 'departamento' en
   * el SELECT a propósito: el frontend ya lee ese campo, así no hay que
   * tocarlo. COALESCE a 'SIN SEGMENTO' para no perder filas de empleados sin
   * segmento asignado.
   */
  async cumplimientoPorArea(startDate: string, endDate: string, company?: string, departamento?: string) {
    this.validarRango(startDate, endDate);

    const porAreaRaw = await this.baseQuery(startDate, endDate, departamento, company)
      .select("COALESCE(r.segmento_nombre, 'SIN SEGMENTO')", 'departamento')
      .addSelect('COUNT(*)', 'total_registros')
      .addSelect('SUM(CASE WHEN r.estado = :tarde THEN 1 ELSE 0 END)', 'total_tardanzas')
      .setParameter('tarde', 'TARDE')
      .groupBy("COALESCE(r.segmento_nombre, 'SIN SEGMENTO')")
      .getRawMany();

    const porEmpleadoRaw = await this.baseQuery(startDate, endDate, departamento, company)
      .select("COALESCE(r.segmento_nombre, 'SIN SEGMENTO')", 'departamento')
      .addSelect('r.cedula', 'cedula')
      .addSelect('r.nombre', 'nombre')
      .addSelect('SUM(CASE WHEN r.estado = :tarde THEN 1 ELSE 0 END)', 'total_tardanzas')
      .addSelect('SUM(CASE WHEN r.estado = :puntual THEN 1 ELSE 0 END)', 'dias_a_tiempo')
      .setParameter('tarde', 'TARDE')
      .setParameter('puntual', 'PUNTUAL')
      .groupBy("COALESCE(r.segmento_nombre, 'SIN SEGMENTO'), r.cedula, r.nombre")
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
  async detalleDia(fecha: string, departamento?: string, company?: string, segmento?: string) {
    if (!fecha) throw new BadRequestException('fecha es requerida (formato YYYY-MM-DD)');
    const filas = await this.baseQuery(fecha, fecha, departamento, company, segmento).getMany();

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

  async tendenciaMensual(startDate: string, endDate: string, departamento?: string, company?: string, segmento?: string) {
    this.validarRango(startDate, endDate);

    const raw = await this.baseQuery(startDate, endDate, departamento, company, segmento)
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
  async estadoAsistencia(startDate: string, endDate: string, departamento?: string, company?: string, segmento?: string) {
    this.validarRango(startDate, endDate);
    const raw = await this.baseQuery(startDate, endDate, departamento, company, segmento)
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

  async tardanzasPorArea(startDate: string, endDate: string, company?: string, departamento?: string, segmento?: string) {
    this.validarRango(startDate, endDate);
    const raw = await this.baseQuery(startDate, endDate, departamento, company, segmento)
      .andWhere('r.estado = :tarde', { tarde: 'TARDE' })
      .select('r.departamento', 'departamento')
      .addSelect('COUNT(*)', 'total_tardanzas')
      .groupBy('r.departamento')
      .orderBy('total_tardanzas', 'DESC')
      .getRawMany();
    return { startDate, endDate, areas: raw.map((r) => ({ departamento: r.departamento, total_tardanzas: Number(r.total_tardanzas) })) };
  }

  async tardanzasPorDia(startDate: string, endDate: string, departamento?: string, company?: string, segmento?: string) {
    this.validarRango(startDate, endDate);
    const raw = await this.baseQuery(startDate, endDate, departamento, company, segmento)
      .andWhere('r.estado = :tarde', { tarde: 'TARDE' })
      .select('CONVERT(varchar, r.fecha, 23)', 'fecha')
      .addSelect('COUNT(*)', 'total_tardanzas')
      .groupBy('r.fecha')
      .orderBy('r.fecha', 'ASC')
      .getRawMany();
    return { startDate, endDate, dias: raw.map((r) => ({ fecha: r.fecha, total_tardanzas: Number(r.total_tardanzas) })) };
  }

  async ausenciasPorDia(startDate: string, endDate: string, departamento?: string, company?: string, segmento?: string) {
    this.validarRango(startDate, endDate);
    const raw = await this.baseQuery(startDate, endDate, departamento, company, segmento)
      .andWhere('r.estado = :ausente', { ausente: 'AUSENTE' })
      .select('CONVERT(varchar, r.fecha, 23)', 'fecha')
      .addSelect('COUNT(*)', 'total_ausencias')
      .groupBy('r.fecha')
      .orderBy('r.fecha', 'ASC')
      .getRawMany();
    return { startDate, endDate, dias: raw.map((r) => ({ fecha: r.fecha, total_ausencias: Number(r.total_ausencias) })) };
  }

  /** Distribución de minutos de tardanza en buckets. */
  async distribucionMinutosTardanza(startDate: string, endDate: string, departamento?: string, company?: string, segmento?: string) {
    this.validarRango(startDate, endDate);
    const filas = await this.baseQuery(startDate, endDate, departamento, company, segmento)
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

  /** Jornadas incompletas / calidad de marcaciones. */
  async calidadMarcaciones(startDate: string, endDate: string, departamento?: string, company?: string, segmento?: string) {
    this.validarRango(startDate, endDate);
    const raw = await this.baseQuery(startDate, endDate, departamento, company, segmento)
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
}
