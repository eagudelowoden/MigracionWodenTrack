import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { CronJob } from 'cron';
import { PazSalvo } from './entities/paz-salvo.entity';
import { OffboardingCronConfig } from './entities/offboarding-cron-config.entity';
import { OffboardingCronLog } from './entities/offboarding-cron-log.entity';
import { SuperAdminCorreoService } from '../usuarios/superadmin-correo.service';

const CRON_JOB_NAME = 'offboarding-recordatorio';
const MODULOS = ['sst', 'ch', 'it'] as const;

@Injectable()
export class OffboardingCronService implements OnModuleInit {
  private readonly logger = new Logger(OffboardingCronService.name);

  constructor(
    @InjectRepository(OffboardingCronConfig)
    private readonly configRepo: Repository<OffboardingCronConfig>,
    @InjectRepository(OffboardingCronLog)
    private readonly logRepo: Repository<OffboardingCronLog>,
    @InjectRepository(PazSalvo)
    private readonly psRepo: Repository<PazSalvo>,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly correoService: SuperAdminCorreoService,
  ) {}

  // ── Inicialización ───────────────────────────────────────────────────────────

  async onModuleInit() {
    const config = await this.obtenerConfig();

    // Limpiar estado 'running' que quedó de un crash anterior
    if (config.ultimo_estado === 'running') {
      config.ultimo_estado = 'error';
      config.ultimo_error = 'Interrumpido por reinicio del servidor.';
      if (!config.ultimo_fin) config.ultimo_fin = new Date();
      await this.configRepo.save(config);

      const logAbierto = await this.logRepo.findOne({
        where: { estado: 'running' },
        order: { inicio: 'DESC' },
      });
      if (logAbierto) {
        logAbierto.estado = 'error';
        logAbierto.error = 'Interrumpido por reinicio del servidor.';
        logAbierto.fin = new Date();
        logAbierto.duracion_seg = Math.round(
          (logAbierto.fin.getTime() - logAbierto.inicio.getTime()) / 1000,
        );
        await this.logRepo.save(logAbierto);
      }
    }

    if (config.activo) {
      this.registrarCron(config.hora, config.minuto);
    }
  }

  // ── Config ───────────────────────────────────────────────────────────────────

  async obtenerConfig(): Promise<OffboardingCronConfig> {
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
    horas_espera?: number;
    correos?: string;
    activo?: boolean;
  }): Promise<OffboardingCronConfig> {
    const config = await this.obtenerConfig();
    if (dto.hora !== undefined) config.hora = dto.hora;
    if (dto.minuto !== undefined) config.minuto = dto.minuto;
    if (dto.horas_espera !== undefined) config.horas_espera = dto.horas_espera;
    if (dto.correos !== undefined) config.correos = dto.correos;
    if (dto.activo !== undefined) config.activo = dto.activo;
    await this.configRepo.save(config);

    this.eliminarCronSiExiste();
    if (config.activo) {
      this.registrarCron(config.hora, config.minuto);
    }
    return config;
  }

  // ── Historial ────────────────────────────────────────────────────────────────

  async obtenerHistorial(limit = 20): Promise<OffboardingCronLog[]> {
    return this.logRepo.find({
      order: { inicio: 'DESC' },
      take: limit,
    });
  }

  // ── Gestión del cron dinámico ────────────────────────────────────────────────

  private registrarCron(hora: number, minuto: number) {
    const expr = `${minuto} ${hora} * * *`;
    this.logger.log(`Registrando cron offboarding: "${expr}"`);
    const job = new CronJob(expr, () => {
      // automático: respeta el umbral de horas configurado (forzar=false)
      this.ejecutarRevision('auto', false).catch((e) =>
        this.logger.error('Error en cron offboarding:', e),
      );
    });
    this.schedulerRegistry.addCronJob(CRON_JOB_NAME, job);
    job.start();
  }

  private eliminarCronSiExiste() {
    try {
      const job = this.schedulerRegistry.getCronJob(CRON_JOB_NAME);
      if (job) {
        job.stop();
        this.schedulerRegistry.deleteCronJob(CRON_JOB_NAME);
      }
    } catch (_) {}
  }

  proximaEjecucion(): Date | null {
    try {
      const job = this.schedulerRegistry.getCronJob(CRON_JOB_NAME);
      return job?.nextDate()?.toJSDate?.() ?? null;
    } catch (_) {
      return null;
    }
  }

  // ── Lógica principal ─────────────────────────────────────────────────────────

  async ejecutarRevision(origen: 'auto' | 'manual' = 'manual', forzar = false): Promise<OffboardingCronLog> {
    const config = await this.obtenerConfig();
    if (config.ultimo_estado === 'running') {
      throw new Error('Ya hay una revisión en curso.');
    }

    const inicio = new Date();
    this.logger.log(`[OffboardingCron] Iniciando revisión (${origen})...`);

    config.ultimo_estado = 'running';
    config.ultimo_inicio = inicio;
    config.ultimo_fin = null;
    config.ultimo_error = null;
    config.ultimo_resumen = null;
    await this.configRepo.save(config);

    const log = this.logRepo.create({ inicio, origen, estado: 'running' });
    await this.logRepo.save(log);

    try {
      // Validar correos configurados
      const correosStr = config.correos?.trim() ?? '';
      if (!correosStr) {
        throw new Error('No hay correos de destino configurados. Configura al menos un correo en el panel.');
      }
      const destinatarios = correosStr
        .split(',')
        .map((c) => c.trim())
        .filter((c) => c.includes('@'));
      if (!destinatarios.length) {
        throw new Error('Los correos configurados no son válidos.');
      }

      // Calcular umbral de tiempo
      const horasEspera = config.horas_espera ?? 24;
      const umbral = new Date(inicio.getTime() - horasEspera * 60 * 60 * 1000);

      // Buscar procesos incompletos cuyo updated_at sea anterior al umbral
      // Si forzar=true (ejecución manual de prueba) → trae TODOS los incompletos sin filtro de tiempo
      const pendientes = await this.psRepo.find({
        where: forzar
          ? { proceso_completo: false }
          : { proceso_completo: false, updated_at: LessThan(umbral) },
        order: { updated_at: 'ASC' },
      });

      this.logger.log(
        `[OffboardingCron] ${pendientes.length} procesos pendientes con +${horasEspera}h sin actividad`,
      );

      let correosEnviados = 0;

      if (pendientes.length > 0) {
        // Agrupar info de módulos pendientes por registro
        const detalle = pendientes.map((ps) => {
          const modulosPendientes = MODULOS.filter((m) => !ps[`${m}_ok`]).map((m) => {
            const labels: Record<string, string> = { sst: 'SST', ch: 'Capital Humano', it: 'IT' };
            return labels[m];
          });
          const horasTranscurridas = Math.round(
            (inicio.getTime() - ps.updated_at.getTime()) / (1000 * 60 * 60),
          );
          return {
            nombre: ps.nombre,
            cedula: ps.cedula,
            departamento: ps.departamento,
            cargo: ps.cargo,
            fechaRenuncia: ps.fecha_renuncia,
            modulosPendientes,
            horasTranscurridas,
          };
        });

        // Construir y enviar correo con HTML detallado
        const html = this.buildCorreoHtml(detalle, horasEspera);
        await this.correoService.enviarCorreoLibre(
          `⏰ Offboarding pendiente — ${pendientes.length} proceso${pendientes.length > 1 ? 's' : ''} sin completar`,
          html,
          destinatarios,
        );
        correosEnviados = 1; // un correo con todos los pendientes
        this.logger.log(
          `[OffboardingCron] Notificación enviada a: ${destinatarios.join(', ')}`,
        );
      }

      const fin = new Date();
      const duracion = Math.round((fin.getTime() - inicio.getTime()) / 1000);
      const resumen = `${pendientes.length} proceso(s) pendiente(s) encontrados, ${correosEnviados} correo(s) enviado(s)`;

      config.ultimo_estado = 'success';
      config.ultimo_fin = fin;
      config.ultima_duracion_seg = duracion;
      config.ultimo_resumen = resumen;
      await this.configRepo.save(config);

      log.fin = fin;
      log.duracion_seg = duracion;
      log.estado = 'success';
      log.pendientes_encontrados = pendientes.length;
      log.correos_enviados = correosEnviados;
      await this.logRepo.save(log);

      this.logger.log(`[OffboardingCron] Finalizado en ${duracion}s — ${resumen}`);
      return log;
    } catch (e) {
      const fin = new Date();
      const duracion = Math.round((fin.getTime() - inicio.getTime()) / 1000);

      config.ultimo_estado = 'error';
      config.ultimo_fin = fin;
      config.ultima_duracion_seg = duracion;
      config.ultimo_error = e.message;
      await this.configRepo.save(config);

      log.fin = fin;
      log.duracion_seg = duracion;
      log.estado = 'error';
      log.error = e.message;
      await this.logRepo.save(log);

      this.logger.error(`[OffboardingCron] Error: ${e.message}`);
      throw e;
    }
  }

  // ── Helper HTML del correo ───────────────────────────────────────────────────

  private buildCorreoHtml(
    detalle: Array<{
      nombre: string;
      cedula: string;
      departamento: string | null;
      cargo: string | null;
      fechaRenuncia: string | null;
      modulosPendientes: string[];
      horasTranscurridas: number;
    }>,
    horasEspera: number,
  ): string {
    const filas = detalle
      .map(
        (d) => `
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:10px 12px;font-size:13px;font-weight:600;color:#111;">${d.nombre}</td>
          <td style="padding:10px 12px;font-size:12px;color:#555;">${d.cedula}</td>
          <td style="padding:10px 12px;font-size:12px;color:#555;">${d.departamento ?? '—'}</td>
          <td style="padding:10px 12px;font-size:12px;color:#555;">${d.fechaRenuncia ?? '—'}</td>
          <td style="padding:10px 12px;">
            ${d.modulosPendientes
              .map(
                (m) =>
                  `<span style="display:inline-block;background:#fef3c7;color:#92400e;font-size:10px;font-weight:600;padding:2px 8px;border-radius:4px;margin:1px;">${m}</span>`,
              )
              .join(' ')}
          </td>
          <td style="padding:10px 12px;font-size:12px;font-weight:600;color:#dc2626;">${d.horasTranscurridas}h</td>
        </tr>`,
      )
      .join('');

    return `
      <div style="font-family:'Segoe UI',Arial,sans-serif;background:#f8fafc;padding:32px 16px;min-height:100vh;">
        <div style="max-width:680px;margin:0 auto;background:#fff;border-radius:8px;border:1px solid #e5e7eb;overflow:hidden;">
          <div style="background:#111;padding:20px 28px;display:flex;align-items:center;gap:10px;">
            <div style="width:8px;height:8px;border-radius:50%;background:#f59e0b;"></div>
            <span style="color:#fff;font-size:14px;font-weight:600;letter-spacing:0.02em;">WodenTrack · Offboarding</span>
          </div>
          <div style="padding:28px;">
            <h2 style="margin:0 0 6px;font-size:18px;font-weight:700;color:#111;">
              ⏰ Procesos de Offboarding sin completar
            </h2>
            <p style="margin:0 0 24px;font-size:13px;color:#555;line-height:1.6;">
              Los siguientes procesos llevan más de <strong>${horasEspera} horas</strong> sin actividad
              y aún tienen módulos del checklist pendientes.
            </p>
            <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
              <thead>
                <tr style="background:#f1f5f9;">
                  <th style="padding:8px 12px;text-align:left;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;">Colaborador</th>
                  <th style="padding:8px 12px;text-align:left;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;">Cédula</th>
                  <th style="padding:8px 12px;text-align:left;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;">Depto.</th>
                  <th style="padding:8px 12px;text-align:left;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;">Renuncia</th>
                  <th style="padding:8px 12px;text-align:left;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;">Pendiente</th>
                  <th style="padding:8px 12px;text-align:left;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;">Sin actividad</th>
                </tr>
              </thead>
              <tbody>${filas}</tbody>
            </table>
            <p style="margin:20px 0 0;font-size:12px;color:#94a3b8;">
              Accede al módulo de Offboarding en WodenTrack para completar los checklists pendientes.
            </p>
          </div>
          <div style="padding:14px 28px;background:#f8fafc;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:11px;color:#94a3b8;">WodenTrack · Recordatorio automático</span>
            <span style="font-size:11px;color:#94a3b8;">${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</span>
          </div>
        </div>
      </div>`;
  }
}
