import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { HoraExtraJob } from './entities/hora-extra-job.entity';
import { CalcularExtrasDto } from './horas-extra.service';

/**
 * Servicio de la COLA de cálculos de horas extra.
 *
 * La API y el cron solo ENCOLAN trabajos aquí (operación instantánea). El worker
 * (proceso aparte) los consume con `tomarSiguiente()` y reporta el resultado con
 * `marcarCompletado` / `marcarError`. No usa Redis: todo vive en SQL Server.
 */
@Injectable()
export class HorasExtraJobService {
  private readonly logger = new Logger(HorasExtraJobService.name);

  constructor(
    @InjectRepository(HoraExtraJob)
    private readonly jobRepo: Repository<HoraExtraJob>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Inserta un trabajo en la cola y devuelve la fila creada.
   * Para trabajos de cron evita duplicados: si ya hay uno pendiente o en proceso
   * para el mismo rango y empresa, lo reutiliza en vez de crear otro.
   */
  async encolar(
    params: CalcularExtrasDto,
    opts: { tipo?: 'cron' | 'manual'; solicitadoPor?: string } = {},
  ): Promise<HoraExtraJob> {
    const tipo = opts.tipo ?? 'manual';
    const rangoDesde = params.soloHoy ? null : params.startDate ?? null;
    const rangoHasta = params.soloHoy ? null : params.endDate ?? null;
    const company =
      params.company && params.company !== 'Todas' ? params.company : null;

    if (tipo === 'cron') {
      const existente = await this.jobRepo
        .createQueryBuilder('j')
        .where('j.tipo = :tipo', { tipo: 'cron' })
        .andWhere('j.estado IN (:...estados)', {
          estados: ['pendiente', 'procesando'],
        })
        .andWhere(
          rangoDesde
            ? 'j.rango_desde = :rd'
            : 'j.rango_desde IS NULL',
          rangoDesde ? { rd: rangoDesde } : {},
        )
        .andWhere(
          rangoHasta ? 'j.rango_hasta = :rh' : 'j.rango_hasta IS NULL',
          rangoHasta ? { rh: rangoHasta } : {},
        )
        .getOne();
      if (existente) {
        this.logger.log(
          `Job cron ya encolado (#${existente.id}) para ${rangoDesde}→${rangoHasta}; se reutiliza.`,
        );
        return existente;
      }
    }

    const job = this.jobRepo.create({
      tipo,
      estado: 'pendiente',
      params: JSON.stringify(params),
      rango_desde: rangoDesde,
      rango_hasta: rangoHasta,
      company,
      solicitado_por: opts.solicitadoPor ?? params.calculado_por ?? null,
      intentos: 0,
      max_intentos: 3,
    });
    const guardado = await this.jobRepo.save(job);
    this.logger.log(`Job #${guardado.id} encolado (${tipo}).`);
    return guardado;
  }

  /**
   * Toma ATÓMICAMENTE el siguiente job pendiente y lo marca 'procesando'.
   * Usa UPDLOCK + READPAST para que dos workers nunca tomen el mismo job.
   * Devuelve null si no hay nada pendiente.
   */
  async tomarSiguiente(): Promise<HoraExtraJob | null> {
    const filas: HoraExtraJob[] = await this.dataSource.query(
      `UPDATE TOP (1) horas_extra_jobs
         SET estado     = 'procesando',
             started_at = SYSUTCDATETIME(),
             intentos   = intentos + 1,
             updated_at = SYSUTCDATETIME()
       OUTPUT inserted.*
       WHERE id = (
         SELECT TOP 1 id
         FROM   horas_extra_jobs WITH (UPDLOCK, READPAST)
         WHERE  estado = 'pendiente' AND intentos < max_intentos
         ORDER BY created_at ASC
       )`,
    );
    return filas && filas.length ? filas[0] : null;
  }

  /** Marca un job como completado con un resumen del resultado. */
  async marcarCompletado(id: number, resumen: string): Promise<void> {
    await this.jobRepo.update(id, {
      estado: 'completado',
      resultado_resumen: resumen,
      error_mensaje: null,
      finished_at: new Date(),
    });
  }

  /**
   * Marca un job como fallido. Si aún quedan reintentos, vuelve a 'pendiente'
   * para que el worker lo retome; si se agotaron, queda en 'error'.
   */
  async marcarError(id: number, mensaje: string): Promise<void> {
    const job = await this.jobRepo.findOne({ where: { id } });
    if (!job) return;
    const agotado = job.intentos >= job.max_intentos;
    await this.jobRepo.update(id, {
      estado: agotado ? 'error' : 'pendiente',
      error_mensaje: mensaje?.slice(0, 2000) ?? 'Error desconocido',
      finished_at: agotado ? new Date() : null,
    });
    this.logger.warn(
      `Job #${id} falló (intento ${job.intentos}/${job.max_intentos})` +
        `${agotado ? ' → ERROR definitivo' : ' → se reintentará'}: ${mensaje}`,
    );
  }

  /** Estado de un job puntual (para que la UI haga polling). */
  async obtenerEstado(id: number): Promise<HoraExtraJob | null> {
    return this.jobRepo.findOne({ where: { id } });
  }

  /** Últimos N jobs (para una vista de monitoreo de la cola). */
  async listarRecientes(limite = 50): Promise<HoraExtraJob[]> {
    return this.jobRepo.find({
      order: { created_at: 'DESC' },
      take: limite,
    });
  }

  /**
   * Recupera jobs que quedaron 'procesando' colgados (ej. el worker se cayó a
   * media tarea). Se llaman al arrancar el worker para devolverlos a la cola.
   */
  async recuperarColgados(minutosLimite = 30): Promise<number> {
    const limite = new Date(Date.now() - minutosLimite * 60_000);
    const res = await this.jobRepo
      .createQueryBuilder()
      .update()
      .set({ estado: 'pendiente' })
      .where('estado = :p', { p: 'procesando' })
      .andWhere('started_at < :limite', { limite })
      .execute();
    return res.affected ?? 0;
  }
}
