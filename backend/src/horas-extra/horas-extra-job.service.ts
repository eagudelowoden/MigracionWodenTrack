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
             worker_pid = @0,
             intentos   = intentos + 1,
             updated_at = SYSUTCDATETIME()
       OUTPUT inserted.*
       WHERE id = (
         SELECT TOP 1 id
         FROM   horas_extra_jobs WITH (UPDLOCK, READPAST)
         WHERE  estado = 'pendiente' AND intentos < max_intentos
         ORDER BY created_at ASC
       )`,
      [process.pid],
    );
    return filas && filas.length ? filas[0] : null;
  }

  /** Intenta matar (best-effort) el proceso worker que tomó un job, por su PID. */
  private matarWorker(pid: number | null, jobId: number): void {
    if (!pid) return;
    try {
      process.kill(pid);
      this.logger.warn(`Job #${jobId}: worker (pid ${pid}) terminado.`);
    } catch {
      // Ya no existe (terminó solo) o no se pudo matar; no es fatal, el job
      // igual se libera/recupera más abajo.
    }
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

  /**
   * Cancela un job que aún no terminó (pendiente o procesando). Si estaba
   * 'procesando', además intenta matar (best-effort) el proceso worker que lo
   * tomó, por su PID — así no queda corriendo de fondo aunque se cancele.
   */
  async cancelarJob(id: number): Promise<{ ok: boolean; mensaje: string }> {
    const job = await this.jobRepo.findOne({ where: { id } });
    if (!job) return { ok: false, mensaje: `Job #${id} no encontrado` };
    if (['completado', 'error', 'cancelado'].includes(job.estado)) {
      return { ok: false, mensaje: `Job #${id} ya está en estado "${job.estado}"` };
    }
    if (job.estado === 'procesando') {
      this.matarWorker(job.worker_pid, job.id);
    }
    await this.jobRepo.update(id, {
      estado: 'cancelado',
      finished_at: new Date(),
      resultado_resumen: 'Cancelado manualmente',
    });
    this.logger.log(`Job #${id} cancelado manualmente.`);
    return { ok: true, mensaje: `Job #${id} cancelado` };
  }

  /** Cuántos jobs están actualmente en estado 'procesando' (para evitar lanzar workers duplicados). */
  async contarProcesando(): Promise<number> {
    return this.jobRepo.count({ where: { estado: 'procesando' } });
  }

  /** Últimos N jobs (para una vista de monitoreo de la cola). */
  async listarRecientes(limite = 50): Promise<HoraExtraJob[]> {
    return this.jobRepo.find({
      order: { created_at: 'DESC' },
      take: limite,
    });
  }

  /**
   * Recupera jobs que quedaron 'procesando' colgados más de `minutosLimite`
   * (ej. el worker se cayó a media tarea, o quedó esperando algo que nunca
   * responde). Antes de devolverlos a la cola intenta MATAR el proceso
   * worker que los tomó (por su PID) — así no queda un proceso zombie
   * corriendo de fondo mientras el job se reprocesa desde cero.
   *
   * Se llama al arrancar cada worker Y también desde `asegurarWorker()`
   * ANTES de decidir si hace falta lanzar uno nuevo: si esto solo corriera al
   * arrancar, un job trabado en 'procesando' bloquearía para siempre el spawn
   * de un worker nuevo (que es justamente lo único que lo destraba).
   */
  async recuperarColgados(minutosLimite = 30): Promise<number> {
    const limite = new Date(Date.now() - minutosLimite * 60_000);
    const colgados = await this.jobRepo.find({ where: { estado: 'procesando' } });
    const vencidos = colgados.filter((j) => j.started_at && j.started_at < limite);
    if (!vencidos.length) return 0;

    for (const job of vencidos) {
      this.matarWorker(job.worker_pid, job.id);
    }

    const res = await this.jobRepo
      .createQueryBuilder()
      .update()
      .set({ estado: 'pendiente' })
      .where('estado = :p', { p: 'procesando' })
      .andWhere('started_at < :limite', { limite })
      .execute();
    this.logger.warn(
      `${res.affected ?? 0} job(s) 'procesando' colgado(s) (>${minutosLimite}min) recuperado(s).`,
    );
    return res.affected ?? 0;
  }
}
