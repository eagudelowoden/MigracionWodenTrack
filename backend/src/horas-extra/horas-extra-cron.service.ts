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
      this.registrarCron(config);
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
    hora_inicio?: number;
    hora_fin?: number;
    company?: string;
  }): Promise<CalculoExtraCronConfig> {
    const config = await this.obtenerConfig();
    if (dto.hora !== undefined) config.hora = dto.hora;
    if (dto.minuto !== undefined) config.minuto = dto.minuto;
    if (dto.activo !== undefined) config.activo = dto.activo;
    if (dto.dias_ventana !== undefined) config.dias_ventana = dto.dias_ventana;
    if (dto.hora_inicio !== undefined) config.hora_inicio = dto.hora_inicio;
    if (dto.hora_fin !== undefined) config.hora_fin = dto.hora_fin;
    if (dto.company !== undefined) config.company = dto.company;
    await this.configRepo.save(config);

    // Re-registrar el cron con la nueva config
    this.eliminarCronSiExiste();
    if (config.activo) {
      this.registrarCron(config);
    }
    return config;
  }

  // ── Ejecución ──────────────────────────────────────────────────────────────

  // Margen de seguridad restado al checkpoint delta, para tolerar desfase de
  // reloj entre este servidor y Odoo, y la latencia entre "se escribió el
  // registro" y "se confirmó el commit" en Odoo.
  private static readonly MARGEN_DELTA_MIN = 15;

  /** Encola el cálculo de la ventana de asentamiento (lo procesa el worker). */
  async encolarRango(origen: string) {
    const config = await this.obtenerConfig();
    const startDate = this.fechaColombia(-config.dias_ventana);
    const endDate = this.fechaColombia(-1); // ayer (último día cerrado)
    const company = config.company || 'Todas'; // la empresa elegida en la config

    // Al menos 1 vez al día se fuerza una corrida COMPLETA (sin delta): el
    // filtro write_date no puede detectar registros BORRADOS en Odoo, ni
    // marcaciones cuya fecha se editó y quedó fuera de la ventana — la
    // corrida completa se autocorrige sola porque recalcula todo el rango.
    const hoy = this.fechaColombia(0);
    const esCorridaCompleta = config.ultima_corrida_completa_fecha !== hoy;
    const writeDateDesde = esCorridaCompleta
      ? undefined
      : config.ultima_corrida_utc ?? undefined;

    // Checkpoint candidato para la PRÓXIMA corrida delta. Se calcula ANTES de
    // que el worker consulte Odoo (aquí, al encolar) y con margen de
    // seguridad, para no perder registros escritos mientras el job corre.
    // Solo se confirma (se guarda en config) si el job termina exitosamente
    // — ver `confirmarCorridaExitosa`, invocado desde worker.ts.
    const checkpointCandidato = new Date(
      Date.now() - HorasExtraCronService.MARGEN_DELTA_MIN * 60_000,
    ).toISOString();

    const job = await this.jobs.encolar(
      {
        startDate,
        endDate,
        company,
        calculado_por: origen,
        guardar: true,
        writeDateDesde,
        _checkpointCandidato: checkpointCandidato,
        _esCorridaCompleta: esCorridaCompleta,
      },
      { tipo: 'cron', solicitadoPor: origen },
    );
    this.logger.log(
      `Encolado job #${job.id} (${origen}) para ${startDate} → ${endDate} | empresa: ${company}` +
        (esCorridaCompleta
          ? ' | corrida COMPLETA (forzada 1x/día).'
          : ` | delta desde ${writeDateDesde}.`),
    );
    // Lanza el worker bajo demanda (procesa la cola y se cierra solo)
    await this.asegurarWorker();
    return job;
  }

  /**
   * Confirma que una corrida CRON delta terminó bien: guarda el checkpoint
   * `write_date` para la próxima corrida y, si esta corrida fue "completa",
   * registra la fecha para no forzar otra el mismo día. Si el job falló, NO
   * se llama esto — la próxima corrida delta simplemente reintenta desde el
   * mismo checkpoint anterior (reprocesa un poco de más, pero no pierde nada).
   */
  async confirmarCorridaExitosa(params: {
    _checkpointCandidato?: string;
    _esCorridaCompleta?: boolean;
  }): Promise<void> {
    if (!params._checkpointCandidato) return;
    const config = await this.obtenerConfig();
    config.ultima_corrida_utc = params._checkpointCandidato;
    if (params._esCorridaCompleta) {
      config.ultima_corrida_completa_fecha = this.fechaColombia(0);
    }
    await this.configRepo.save(config);
  }

  /**
   * Lanza el worker como PROCESO APARTE en modo "once": procesa la cola hasta
   * vaciarla y se cierra. Verifica en BD (no en un flag en memoria) si ya hay jobs
   * procesando activamente, para no lanzar workers concurrentes con el mismo rango.
   */
  async asegurarWorker(): Promise<void> {
    // Si hay un worker DEMONIO siempre vivo (ej. PM2), la API no lanza workers:
    // el demonio toma los jobs de la cola. Se activa con HX_NO_SPAWN=1.
    if (process.env.HX_NO_SPAWN === '1') {
      this.logger.log('HX_NO_SPAWN activo: el job lo tomará el worker demonio.');
      return;
    }
    // Antes de decidir si hace falta un worker nuevo, mata/recupera cualquier
    // job "procesando" abandonado (>30min sin actualizarse — el worker murió
    // sin avisar). Si no se hiciera esto ACÁ, un job trabado bloquearía este
    // chequeo para siempre: nunca se vería "libre" y nunca se lanzaría el
    // worker nuevo que es justamente lo único que lo recupera.
    const recuperados = await this.jobs.recuperarColgados(30);
    if (recuperados > 0) {
      this.logger.warn(`${recuperados} job(s) 'procesando' colgado(s) recuperado(s) antes de evaluar el spawn.`);
    }

    // Verificar en BD si ya hay jobs procesando. Un flag en memoria no sirve porque
    // el worker es un proceso detached y el flag se libera antes de que termine
    // (el job tarda 200s pero el flag se liberaba a los 15s → se lanzaban workers en paralelo).
    const procesando = await this.jobs.contarProcesando();
    if (procesando > 0) {
      this.logger.log(`${procesando} job(s) en procesando; no se lanza otro worker.`);
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

    // DETACHED: el worker corre como proceso TOTALMENTE independiente, no atado
    // a la API. Así, lanzarlo no reinicia ni afecta al servicio (el problema que
    // veías). unref() permite que la API no espere por él. Si revienta, muere solo.
    // Forzar heap amplio (4 GB) en la CLI: un arg de línea de comandos gana
    // sobre cualquier --max-old-space-size heredado vía NODE_OPTIONS. Sin esto,
    // si el servicio que lanza la API arranca con un límite bajo, el worker lo
    // hereda y muere por OOM al procesar datasets grandes de Odoo.
    const envSinLimite = { ...process.env };
    delete envSinLimite.NODE_OPTIONS;

    const hijo = spawn(
      process.execPath,
      ['--max-old-space-size=4096', workerPath],
      {
        env: { ...envSinLimite, HX_WORKER: '1', HX_WORKER_ONCE: '1' },
        stdio: 'ignore',
        detached: true,
        windowsHide: true,
      },
    );
    hijo.on('error', (err) => {
      this.logger.error(`No se pudo lanzar el worker: ${err.message}`);
    });
    this.logger.log(`Worker lanzado (pid ${hijo.pid}) en modo once (independiente).`);
    hijo.unref(); // desligar del proceso de la API
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
    await this.asegurarWorker();
    return job;
  }

  // ── CronJob dinámico ─────────────────────────────────────────────────────────

  private registrarCron(config: CalculoExtraCronConfig) {
    // Corre CADA HORA (en el minuto configurado) dentro del rango horario.
    // Ej: minuto=0, inicio=6, fin=20 → "0 6-20 * * *" (6:00, 7:00, …, 20:00).
    const min = config.minuto ?? 0;
    const ini = config.hora_inicio ?? 6;
    const fin = config.hora_fin ?? 20;
    const rango = ini === fin ? `${ini}` : `${ini}-${fin}`;
    const cronExpr = `${min} ${rango} * * *`;
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
