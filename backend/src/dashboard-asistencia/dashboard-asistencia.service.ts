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
  private baseQuery(
    startDate: string,
    endDate: string,
    departamento?: string,
    company?: string,
    segmento?: string,
    centroCosto?: string,
  ) {
    const qb = this.resumenRepo
      .createQueryBuilder('r')
      .where('r.fecha BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('r.estado != :noProg', { noProg: 'NO_PROGRAMADO' });
    if (departamento) qb.andWhere('r.departamento = :departamento', { departamento });
    if (company) qb.andWhere('r.company = :company', { company });
    if (segmento === 'SIN SEGMENTO') qb.andWhere('r.segmento_nombre IS NULL');
    else if (segmento) qb.andWhere('r.segmento_nombre = :segmento', { segmento });
    // 'SIN CENTRO DE COSTO' es el valor que muestra el frontend para filas sin
    // centro de costo asignado (mismo patrón que 'SIN SEGMENTO' arriba).
    if (centroCosto === 'SIN CENTRO DE COSTO') qb.andWhere('r.centro_costo_nombre IS NULL');
    else if (centroCosto) qb.andWhere('r.centro_costo_nombre = :centroCosto', { centroCosto });
    return qb;
  }

  async rankingTardanzas(
    startDate: string,
    endDate: string,
    departamento?: string,
    company?: string,
    segmento?: string,
    centroCosto?: string,
  ) {
    this.validarRango(startDate, endDate);
    const filas = await this.baseQuery(startDate, endDate, departamento, company, segmento, centroCosto)
      // "Llegó tarde" = minutos_tarde > 0, NO estado = 'TARDE' — ese último
      // es excluyente con INCOMPLETO (si no marcó salida, gana INCOMPLETO y
      // nunca llega a TARDE aunque sí haya llegado tarde). minutos_tarde ya
      // se calcula igual en ambos casos (ver armarFila en
      // asistencia-resumen.service.ts), así que es la señal correcta —
      // alguien puede estar en tardanzas Y en incompletas a la vez.
      .andWhere('r.minutos_tarde > 0')
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
      .addSelect('r.hora_salida', 'hora_salida')
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
        hora_salida: f.hora_salida,
        minutos_tarde: f.minutos_tarde != null ? Number(f.minutos_tarde) : null,
      });
    }

    const ranking = Array.from(porCedula.values())
      .map((e) => ({ ...e, total_tardanzas: e.detalle.length }))
      .sort((a, b) => b.total_tardanzas - a.total_tardanzas);

    return { startDate, endDate, departamento: departamento ?? null, ranking };
  }

  /**
   * Agrupa cumplimiento (% + peor/mejor empleado) por lo que diga `groupExpr`
   * (una expresión SQL, ej. columna o COALESCE) — compartido por
   * `cumplimientoPorArea` (agrupa por segmento) y `cumplimientoPorCentroCosto`
   * (agrupa por centro de costo, siempre dentro de UN segmento). `aliasField`
   * es el nombre de columna que usa el SELECT/GROUP BY y con el que se arma
   * cada fila del resultado.
   */
  private async cumplimientoAgrupado(
    startDate: string,
    endDate: string,
    groupExpr: string,
    aliasField: string,
    opts: { company?: string; departamento?: string; segmento?: string },
  ): Promise<any[]> {
    const { company, departamento, segmento } = opts;

    // "Llegó tarde" = minutos_tarde > 0 — independiente de estado (no
    // excluyente con INCOMPLETO, ver comentario en rankingTardanzas).
    const porGrupoRaw = await this.baseQuery(startDate, endDate, departamento, company, segmento)
      .select(groupExpr, aliasField)
      .addSelect('COUNT(*)', 'total_registros')
      .addSelect('SUM(CASE WHEN r.minutos_tarde > 0 THEN 1 ELSE 0 END)', 'total_tardanzas')
      .groupBy(groupExpr)
      .getRawMany();

    const porEmpleadoRaw = await this.baseQuery(startDate, endDate, departamento, company, segmento)
      .select(groupExpr, aliasField)
      .addSelect('r.cedula', 'cedula')
      .addSelect('r.nombre', 'nombre')
      .addSelect('SUM(CASE WHEN r.minutos_tarde > 0 THEN 1 ELSE 0 END)', 'total_tardanzas')
      .addSelect('SUM(CASE WHEN r.estado = :puntual THEN 1 ELSE 0 END)', 'dias_a_tiempo')
      .setParameter('puntual', 'PUNTUAL')
      .groupBy(`${groupExpr}, r.cedula, r.nombre`)
      .getRawMany();

    const peorPorGrupo = new Map<string, { nombre: string; total_tardanzas: number }>();
    const mejorPorGrupo = new Map<string, { nombre: string; dias_a_tiempo: number }>();
    for (const e of porEmpleadoRaw) {
      const clave = e[aliasField];
      const tard = Number(e.total_tardanzas);
      const puntual = Number(e.dias_a_tiempo);
      const peorActual = peorPorGrupo.get(clave);
      if (tard > 0 && (!peorActual || tard > peorActual.total_tardanzas)) {
        peorPorGrupo.set(clave, { nombre: e.nombre, total_tardanzas: tard });
      }
      const mejorActual = mejorPorGrupo.get(clave);
      if (tard === 0 && (!mejorActual || puntual > mejorActual.dias_a_tiempo)) {
        mejorPorGrupo.set(clave, { nombre: e.nombre, dias_a_tiempo: puntual });
      }
    }

    return porGrupoRaw
      .map((a) => {
        const total_registros = Number(a.total_registros);
        const total_tardanzas = Number(a.total_tardanzas);
        return {
          [aliasField]: a[aliasField],
          total_registros,
          total_tardanzas,
          porcentaje_cumplimiento:
            total_registros > 0 ? Math.round((100 - (total_tardanzas / total_registros) * 100) * 100) / 100 : 100,
          peor_empleado: peorPorGrupo.get(a[aliasField])?.nombre ?? null,
          mejor_empleado: mejorPorGrupo.get(a[aliasField])?.nombre ?? null,
        };
      })
      .sort((a, b) => b.porcentaje_cumplimiento - a.porcentaje_cumplimiento);
  }

  /**
   * Agrupa por SEGMENTO (maestro_segmentos_estructura, propio de esta app) en
   * vez de `departamento` (el que reporta Odoo) — a diferencia del resto de
   * endpoints "por área" de este servicio, que siguen usando `departamento`.
   * El filtro `departamento` recibido de la UI sigue aplicando tal cual; solo
   * lo que se AGRUPA cambia de fuente. Se usa el alias 'departamento' en el
   * SELECT a propósito: el frontend ya lee ese campo, así no hay que
   * tocarlo. COALESCE a 'SIN SEGMENTO' para no perder filas sin segmento.
   */
  async cumplimientoPorArea(startDate: string, endDate: string, company?: string, departamento?: string, segmento?: string) {
    this.validarRango(startDate, endDate);
    const areas = await this.cumplimientoAgrupado(
      startDate,
      endDate,
      "COALESCE(r.segmento_nombre, 'SIN SEGMENTO')",
      'departamento',
      { company, departamento, segmento },
    );
    return { startDate, endDate, areas };
  }

  /**
   * Drill-down: cumplimiento por CENTRO DE COSTO, siempre acotado a UN
   * segmento (obligatorio) — es lo que reemplaza el gráfico de "Cumplimiento
   * por área" cuando ya hay un segmento elegido, para ver el desglose interno.
   */
  async cumplimientoPorCentroCosto(startDate: string, endDate: string, segmento: string, company?: string) {
    this.validarRango(startDate, endDate);
    const centros = await this.cumplimientoAgrupado(
      startDate,
      endDate,
      "COALESCE(r.centro_costo_nombre, 'SIN CENTRO DE COSTO')",
      'centro_costo',
      { company, segmento },
    );
    return { startDate, endDate, centros };
  }

  async departamentos(company?: string): Promise<{ departamentos: string[] }> {
    const departamentos = await this.usuariosService.getDepartamentosMalla(company);
    return { departamentos };
  }

  // ── Nuevos: dashboard ampliado ────────────────────────────────────────────

  /** Dona: cuántos días-persona cayeron en cada estado. */
  async estadoAsistencia(startDate: string, endDate: string, departamento?: string, company?: string, segmento?: string, centroCosto?: string) {
    this.validarRango(startDate, endDate);
    const raw = await this.baseQuery(startDate, endDate, departamento, company, segmento, centroCosto)
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

  async tardanzasPorArea(startDate: string, endDate: string, company?: string, departamento?: string, segmento?: string, centroCosto?: string) {
    this.validarRango(startDate, endDate);
    const raw = await this.baseQuery(startDate, endDate, departamento, company, segmento, centroCosto)
      .andWhere('r.minutos_tarde > 0')
      .select('r.departamento', 'departamento')
      .addSelect('COUNT(*)', 'total_tardanzas')
      .groupBy('r.departamento')
      .orderBy('total_tardanzas', 'DESC')
      .getRawMany();
    return { startDate, endDate, areas: raw.map((r) => ({ departamento: r.departamento, total_tardanzas: Number(r.total_tardanzas) })) };
  }

}
