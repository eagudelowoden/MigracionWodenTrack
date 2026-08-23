import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CronJob } from 'cron';
import { fork, ChildProcess } from 'child_process';
import { join } from 'path';
import { existsSync } from 'fs';
import { AsistenciaCronConfig } from './entities/asistencia-cron-config.entity';
import { AsistenciaCronLog } from './entities/asistencia-cron-log.entity';

const CRON_JOB_NAME = 'asistencia-resumen-diario';

/**
 * Cron configurable del resumen diario de asistencia. Corre UNA vez al día a
 * la hora configurada (no cada hora, a diferencia de horas extra): calcula
 * "ayer" (más una ventana de asentamiento hacia atrás) y lo guarda vía el
 * worker transitorio `asistencia-resumen-worker.ts` — nunca calcula en el
 * proceso de la API. Administrable desde Super Admin igual que horas extra.
 */
@Injectable()
export class AsistenciaResumenCronService implements OnModuleInit {
  private readonly logger = new Logger(AsistenciaResumenCronService.name);
  private procesando = false;

  constructor(
    @InjectRepository(AsistenciaCronConfig)
    private readonly configRepo: Repository<AsistenciaCronConfig>,
    @InjectRepository(AsistenciaCronLog)
    private readonly logRepo: Repository<AsistenciaCronLog>,
    private readonly scheduler: SchedulerRegistry,
  ) {}

  async obtenerLogs(limit = 20): Promise<AsistenciaCronLog[]> {
    return this.logRepo.find({ order: { id: 'DESC' }, take: limit });
  }

  async onModuleInit() {
    if (process.env.HX_WORKER === '1') return; // el worker no registra el cron

    try {
      const config = await this.obtenerConfig();
      if (config.activo) this.registrarCron(config);
    } catch (e: any) {
      this.logger.error(
        `No se pudo inicializar el cron de resumen de asistencia (la API sigue arrancando igual): ${e?.message}`,
      );
    }
  }

  // ── Config ───────────────────────────────────────────────────────────────

  async obtenerConfig(): Promise<AsistenciaCronConfig> {
    let config = await this.configRepo.findOne({ where: { id: 1 } });
    if (!config) {
      config = this.configRepo.create({ id: 1 });
      await this.configRepo.save(config);
    }
    return config;
  }

  async actualizarConfig(dto: {
    hora?: number;
    minuto?: number;
    activo?: boolean;
    dias_ventana?: number;
    company?: string;
    rango_fijo_desde?: string | null;
    rango_fijo_hasta?: string | null;
  }): Promise<AsistenciaCronConfig> {
    const config = await this.obtenerConfig();
    if (dto.hora !== undefined) config.hora = dto.hora;
    if (dto.minuto !== undefined) config.minuto = dto.minuto;
    if (dto.activo !== undefined) config.activo = dto.activo;
    if (dto.dias_ventana !== undefined) config.dias_ventana = dto.dias_ventana;
    if (dto.company !== undefined) config.company = dto.company;
    if (dto.rango_fijo_desde !== undefined) config.rango_fijo_desde = dto.rango_fijo_desde || null;
    if (dto.rango_fijo_hasta !== undefined) config.rango_fijo_hasta = dto.rango_fijo_hasta || null;
    await this.configRepo.save(config);

    this.eliminarCronSiExiste();
    if (config.activo) this.registrarCron(config);
    return config;
  }

  // ── Ejecución ──────────────────────────────────────────────────────────────

  /**
   * Rango que procesa la corrida automática: si el config trae un rango fijo
   * (Desde/Hasta guardados), SIEMPRE recalcula exactamente ese rango cada
   * noche; si no, usa la ventana móvil "últimos N días → ayer".
   */
  private rangoParaCorrida(config: AsistenciaCronConfig): { startDate: string; endDate: string } {
    if (config.rango_fijo_desde && config.rango_fijo_hasta) {
      return { startDate: config.rango_fijo_desde, endDate: config.rango_fijo_hasta };
    }
    return { startDate: this.fechaColombia(-config.dias_ventana), endDate: this.fechaColombia(-1) };
  }

  /** Corrida automática programada por el cron. */
  async ejecutarCorridaProgramada(): Promise<void> {
    const config = await this.obtenerConfig();
    const { startDate, endDate } = this.rangoParaCorrida(config);
    await this.lanzarWorker(startDate, endDate, config.company, 'cron');
    config.ultima_corrida_fecha = this.fechaColombia(0);
    await this.configRepo.save(config);
  }

  /**
   * Botón "Ejecutar ahora" / backfill desde Super Admin. NO espera a que el
   * worker termine (un backfill de varios meses puede tardar minutos) — lo
   * lanza y responde de inmediato; el estado se consulta con `obtenerLogs()`.
   */
  async ejecutarAhora(opts?: { startDate?: string; endDate?: string; company?: string }): Promise<{ startDate: string; endDate: string; company: string }> {
    const config = await this.obtenerConfig();
    const startDate = opts?.startDate || this.fechaColombia(-config.dias_ventana);
    const endDate = opts?.endDate || this.fechaColombia(-1);
    const company = opts?.company && opts.company !== '' ? opts.company : config.company || 'Todas';
    this.lanzarWorker(startDate, endDate, company, 'manual').catch((e) =>
      this.logger.error(`Ejecución manual del resumen de asistencia falló: ${e?.message}`),
    );
    return { startDate, endDate, company };
  }

  estaProcesando(): boolean {
    return this.procesando;
  }

  /**
   * Botón de emergencia si `procesando` se queda pegado en `true` (ej. el
   * worker se colgó sin nunca emitir 'ready'/'exit' — antes del watchdog de
   * abajo eso dejaba el botón "Ejecutar ahora" bloqueado para siempre). Mata
   * el proceso hijo si sigue vivo y libera el flag.
   */
  async forzarLiberar(): Promise<{ liberado: boolean }> {
    const estabaPegado = this.procesando;
    if (this.hijoActual) {
      try {
        this.hijoActual.kill('SIGKILL');
      } catch (_) {
        /* ya estaba muerto */
      }
    }
    if (this.logActualId) {
      await this.cerrarLog(this.logActualId, 'error', null, 'Liberado manualmente desde Super Admin (worker atascado).');
    }
    this.procesando = false;
    this.hijoActual = null;
    this.logActualId = null;
    return { liberado: estabaPegado };
  }

  private hijoActual: ChildProcess | null = null;
  private logActualId: number | null = null;

  private async cerrarLog(id: number, estado: string, total_filas: number | null, error_mensaje: string | null) {
    try {
      await this.logRepo.update(id, { estado, total_filas, error_mensaje, finalizado_at: new Date() });
    } catch (e: any) {
      this.logger.error(`No se pudo actualizar el log #${id} del cron de asistencia: ${e?.message}`);
    }
  }

  // Si el worker nunca emite 'ready'/'exit' (ej. se cuelga autenticando con
  // Odoo, o createApplicationContext no termina), sin este watchdog el flag
  // `procesando` quedaba pegado en `true` PARA SIEMPRE — el botón "Ejecutar
  // ahora" se veía bloqueado indefinidamente sin ningún error visible.
  private static readonly TIMEOUT_MS = 20 * 60 * 1000; // 20 min

  /**
   * Lanza `asistencia-resumen-worker.ts` como PROCESO APARTE (fork con IPC) y
   * espera a que termine. Al ser proceso aparte, si revienta memoria muere
   * solo el worker — nunca la API.
   */
  private async lanzarWorker(
    startDate: string,
    endDate: string,
    company: string | undefined,
    tipo: 'cron' | 'manual',
  ): Promise<void> {
    if (this.procesando) {
      this.logger.warn('Ya hay una corrida de resumen de asistencia en curso; se omite esta.');
      return;
    }
    // dist/dashboard-asistencia/asistencia-resumen-cron.service.js → dist/asistencia-resumen-worker.js
    const workerPath = join(__dirname, '..', 'asistencia-resumen-worker.js');
    if (!existsSync(workerPath)) {
      this.logger.error(`No se encontró el worker en ${workerPath}. ¿Compilaste el backend (npm run build)?`);
      return;
    }

    this.procesando = true;
    const log = await this.logRepo.save(
      this.logRepo.create({
        tipo,
        company: company ?? null,
        rango_desde: startDate,
        rango_hasta: endDate,
        estado: 'procesando',
      }),
    );
    this.logActualId = log.id;

    const envSinLimite = { ...process.env };
    delete envSinLimite.NODE_OPTIONS;

    return new Promise((resolve) => {
      let hijo: ChildProcess;
      try {
        hijo = fork(workerPath, [], {
          execArgv: ['--max-old-space-size=4096'],
          env: { ...envSinLimite, HX_WORKER: '1' },
          stdio: 'ignore',
        });
      } catch (e: any) {
        this.logger.error(`No se pudo lanzar el worker de resumen: ${e?.message}`);
        this.procesando = false;
        this.cerrarLog(log.id, 'error', null, e?.message || 'No se pudo lanzar el worker');
        this.logActualId = null;
        return resolve();
      }

      this.hijoActual = hijo;
      let liquidado = false;
      let resultado: { estado: string; total: number | null; error: string | null } = {
        estado: 'error',
        total: null,
        error: 'El proceso terminó sin avisar si tuvo éxito (posible caída inesperada).',
      };

      const watchdog = setTimeout(() => {
        this.logger.error(
          `Worker de resumen de asistencia superó ${AsistenciaResumenCronService.TIMEOUT_MS / 60000} min sin terminar — se mata el proceso.`,
        );
        resultado = { estado: 'error', total: null, error: 'Tiempo excedido (20 min) — el proceso fue forzado a terminar.' };
        try {
          hijo.kill('SIGKILL');
        } catch (_) {
          /* ya estaba muerto */
        }
        terminar();
      }, AsistenciaResumenCronService.TIMEOUT_MS);

      const terminar = () => {
        if (liquidado) return;
        liquidado = true;
        clearTimeout(watchdog);
        this.procesando = false;
        this.hijoActual = null;
        this.logActualId = null;
        this.cerrarLog(log.id, resultado.estado, resultado.total, resultado.error);
        resolve();
      };

      hijo.on('message', (msg: any) => {
        if (msg?.type === 'ready') {
          hijo.send({ tipo: 'params', startDate, endDate, company });
        } else if (msg?.type === 'done') {
          this.logger.log(`Resumen de asistencia ${startDate} → ${endDate}: ${msg.total} filas guardadas.`);
          resultado = { estado: 'completado', total: msg.total ?? null, error: null };
        } else if (msg?.type === 'error') {
          this.logger.error(`Worker de resumen de asistencia falló: ${msg.message}`);
          resultado = { estado: 'error', total: null, error: msg.message || 'Error desconocido' };
        }
      });
      hijo.on('exit', terminar);
      hijo.on('error', (err) => {
        this.logger.error(`Error en worker de resumen de asistencia: ${err.message}`);
        resultado = { estado: 'error', total: null, error: err.message };
        terminar();
      });
    });
  }

  // ── CronJob dinámico ─────────────────────────────────────────────────────

  private registrarCron(config: AsistenciaCronConfig) {
    const cronExpr = `${config.minuto ?? 0} ${config.hora ?? 3} * * *`;
    this.logger.log(`Registrando cron de resumen de asistencia: "${cronExpr}" (America/Bogota)`);
    const job = new CronJob(
      cronExpr,
      () => {
        this.ejecutarCorridaProgramada().catch((e) =>
          this.logger.error('Error en cron de resumen de asistencia:', e),
        );
      },
      null,
      false,
      'America/Bogota',
    );
    this.scheduler.addCronJob(CRON_JOB_NAME, job);
    job.start();
  }

  private eliminarCronSiExiste() {
    try {
      const job = this.scheduler.getCronJob(CRON_JOB_NAME);
      if (job) {
        job.stop();
        this.scheduler.deleteCronJob(CRON_JOB_NAME);
      }
    } catch (_) {
      /* no existía */
    }
  }

  proximaEjecucion(): Date | null {
    try {
      const job = this.scheduler.getCronJob(CRON_JOB_NAME);
      return job?.nextDate()?.toJSDate?.() ?? null;
    } catch (_) {
      return null;
    }
  }

  private fechaColombia(dias: number): string {
    const hoyStr = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    const [y, m, d] = hoyStr.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d + dias));
    return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
  }
}
