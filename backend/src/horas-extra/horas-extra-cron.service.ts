import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CronJob } from 'cron';
import { spawn } from 'child_process';
import { join } from 'path';
import { existsSync } from 'fs';
import { HorasExtraJobService } from './horas-extra-job.service';
import { CalculoExtraCronConfig } from './entities/calculo-extra-cron-config.entity';

const CRON_JOB_NAME = 'calculo-horas-extra';

/**
 * Cron configurable de horas extra. NO calcula: solo ENCOLA un job que el worker
 * (proceso aparte) procesa. Se administra desde Super Admin (activar/desactivar,
 * hora, ejecutar ahora). Por defecto 9 AM (el turno nocturno más tardío cierra
 * ~06:00) y recalcula los últimos N días (ventana de asentamiento).
 */
@Injectable()
export class HorasExtraCronService implements OnModuleInit {
  private readonly logger = new Logger(HorasExtraCronService.name);
  // Evita lanzar varios workers a la vez. Se libera cuando el worker se cierra.
  private workerCorriendo = false;

  constructor(
    @InjectRepository(CalculoExtraCronConfig)
    private readonly configRepo: Repository<CalculoExtraCronConfig>,
    private readonly jobs: HorasExtraJobService,
    private readonly scheduler: SchedulerRegistry,
  ) {}

  async onModuleInit() {
    // El worker no registra el cron (solo procesa la cola).
    if (process.env.HX_WORKER === '1') return;
    const config = await this.obtenerConfig();
    if (config.activo) {
      this.registrarCron(config.hora, config.minuto);
    }
  }

  // ── Config ───────────────────────────────────────────────────────────────────

  async obtenerConfig(): Promise<CalculoExtraCronConfig> {
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
  }): Promise<CalculoExtraCronConfig> {
    const config = await this.obtenerConfig();
    if (dto.hora !== undefined) config.hora = dto.hora;
    if (dto.minuto !== undefined) config.minuto = dto.minuto;
    if (dto.activo !== undefined) config.activo = dto.activo;
    if (dto.dias_ventana !== undefined) config.dias_ventana = dto.dias_ventana;
    await this.configRepo.save(config);

    // Re-registrar el cron con la nueva config
    this.eliminarCronSiExiste();
    if (config.activo) {
      this.registrarCron(config.hora, config.minuto);
    }
    return config;
  }

  // ── Ejecución ──────────────────────────────────────────────────────────────

  /** Encola el cálculo de la ventana de asentamiento (lo procesa el worker). */
  async encolarRango(origen: string) {
    const config = await this.obtenerConfig();
    const startDate = this.fechaColombia(-config.dias_ventana);
    const endDate = this.fechaColombia(-1); // ayer (último día cerrado)
    const job = await this.jobs.encolar(
      {
        startDate,
        endDate,
        company: 'Todas',
        calculado_por: origen,
        guardar: true,
      },
      { tipo: 'cron', solicitadoPor: origen },
    );
    this.logger.log(
      `Encolado job #${job.id} (${origen}) para ${startDate} → ${endDate}.`,
    );
    // Lanza el worker bajo demanda (procesa la cola y se cierra solo)
    this.asegurarWorker();
    return job;
  }

  /**
   * Lanza el worker como PROCESO APARTE en modo "once": procesa la cola hasta
   * vaciarla y se cierra. Así no hay que dejarlo prendido todo el día. Si ya hay
   * uno corriendo, no lanza otro (la cola se procesa de todas formas).
   */
  asegurarWorker() {
    if (this.workerCorriendo) {
      this.logger.log('Worker ya en ejecución; el job se procesará en esa corrida.');
      return;
    }
    // dist/horas-extra/horas-extra-cron.service.js → dist/worker.js
    const workerPath = join(__dirname, '..', 'worker.js');
    if (!existsSync(workerPath)) {
      this.logger.error(
        `No se encontró el worker en ${workerPath}. ¿Compilaste el backend (npm run build)?`,
      );
      return;
    }

    this.workerCorriendo = true;
    const hijo = spawn(process.execPath, [workerPath], {
      env: { ...process.env, HX_WORKER: '1', HX_WORKER_ONCE: '1' },
      stdio: 'ignore',
      // No detached: si la API se reinicia, el hijo termina (los jobs colgados
      // se recuperan en el siguiente arranque). Su memoria es propia: si revienta,
      // muere solo él, no la API.
    });
    this.logger.log(`Worker lanzado (pid ${hijo.pid}) en modo once.`);

    hijo.on('exit', (code) => {
      this.workerCorriendo = false;
      this.logger.log(`Worker finalizó (código ${code}).`);
    });
    hijo.on('error', (err) => {
      this.workerCorriendo = false;
      this.logger.error(`No se pudo lanzar el worker: ${err.message}`);
    });
  }

  /**
   * Botón "Ejecutar ahora" desde Super Admin. Si recibe un rango (startDate/
   * endDate) calcula ESE rango (ej. backfill de 2 meses); si no, usa la ventana
   * de asentamiento por defecto.
   */
  async ejecutarAhora(opts?: {
    startDate?: string;
    endDate?: string;
    company?: string;
  }) {
    const config = await this.obtenerConfig();
    // Rango: el que manden, o la ventana de asentamiento por defecto
    const startDate = opts?.startDate || this.fechaColombia(-config.dias_ventana);
    const endDate = opts?.endDate || this.fechaColombia(-1);
    // Empresa: SIEMPRE se respeta la elegida (con o sin fechas)
    const company = opts?.company && opts.company !== '' ? opts.company : 'Todas';

    const job = await this.jobs.encolar(
      {
        startDate,
        endDate,
        company,
        calculado_por: 'Recálculo manual (Super Admin)',
        guardar: true,
      },
      { tipo: 'manual', solicitadoPor: 'Super Admin' },
    );
    this.logger.log(
      `Encolado job manual #${job.id} para ${startDate} → ${endDate} | empresa: ${company}.`,
    );
    this.asegurarWorker();
    return job;
  }

  // ── CronJob dinámico ─────────────────────────────────────────────────────────

  private registrarCron(hora: number, minuto: number) {
    const cronExpr = `${minuto} ${hora} * * *`;
    this.logger.log(`Registrando cron horas extra: "${cronExpr}"`);
    const job = new CronJob(cronExpr, () => {
      this.encolarRango('Cron automático').catch((e) =>
        this.logger.error('Error en cron de horas extra:', e),
      );
    });
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

  // Fecha Colombia (YYYY-MM-DD) desplazada `dias` días.
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
