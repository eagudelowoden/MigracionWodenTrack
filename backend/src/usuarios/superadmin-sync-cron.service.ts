import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CronJob } from 'cron';
import { OdooService } from '../odoo/odoo.service';
import { Usuario } from './entities/usuario.entity';
import { MallaAsignacion } from '../mallas/entities/malla-asignacion.entity';
import { SyncCronConfig } from './entities/sync-cron-config.entity';
import { SyncCronLog } from './entities/sync-cron-log.entity';

const CRON_JOB_NAME = 'sync-odoo-nocturno';

@Injectable()
export class SuperAdminSyncCronService implements OnModuleInit {
  private readonly logger = new Logger(SuperAdminSyncCronService.name);

  constructor(
    @InjectRepository(SyncCronConfig)
    private readonly configRepo: Repository<SyncCronConfig>,
    @InjectRepository(SyncCronLog)
    private readonly logRepo: Repository<SyncCronLog>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(MallaAsignacion)
    private readonly asignacionRepo: Repository<MallaAsignacion>,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly odoo: OdooService,
  ) {}

  // ── Al arrancar el servidor, registra el cron con la config guardada ────────
  async onModuleInit() {
    const config = await this.obtenerConfig();
    if (config.activo) {
      this.registrarCron(config.hora, config.minuto);
    }
  }

  // ── Config ──────────────────────────────────────────────────────────────────

  async obtenerConfig(): Promise<SyncCronConfig> {
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
    paises?: string;
    activo?: boolean;
  }): Promise<SyncCronConfig> {
    const config = await this.obtenerConfig();
    if (dto.hora !== undefined) config.hora = dto.hora;
    if (dto.minuto !== undefined) config.minuto = dto.minuto;
    if (dto.paises !== undefined) config.paises = dto.paises;
    if (dto.activo !== undefined) config.activo = dto.activo;
    await this.configRepo.save(config);

    // Re-registrar el cron con la nueva hora
    this.eliminarCronSiExiste();
    if (config.activo) {
      this.registrarCron(config.hora, config.minuto);
    }

    return config;
  }

  // ── Historial ────────────────────────────────────────────────────────────────

  async obtenerHistorial(limit = 20): Promise<SyncCronLog[]> {
    return this.logRepo.find({
      order: { inicio: 'DESC' },
      take: limit,
    });
  }

  // ── Gestión del CronJob dinámico ─────────────────────────────────────────────

  private registrarCron(hora: number, minuto: number) {
    const cronExpr = `${minuto} ${hora} * * *`;
    this.logger.log(`Registrando cron sync: "${cronExpr}"`);

    const job = new CronJob(cronExpr, () => {
      this.ejecutarSync('auto').catch((e) =>
        this.logger.error('Error en cron nocturno:', e),
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
    } catch (_) {
      // El job no existía, no pasa nada
    }
  }

  proximaEjecucion(): Date | null {
    try {
      const job = this.schedulerRegistry.getCronJob(CRON_JOB_NAME);
      return job?.nextDate()?.toJSDate?.() ?? null;
    } catch (_) {
      return null;
    }
  }

  // ── Lógica principal de sincronización ──────────────────────────────────────

  async ejecutarSync(origen: 'auto' | 'manual' = 'manual'): Promise<SyncCronLog> {
    // Verificar que no esté corriendo ya
    const config = await this.obtenerConfig();
    if (config.ultimo_estado === 'running') {
      throw new Error('Ya hay una sincronización en curso.');
    }

    const inicio = new Date();
    this.logger.log(`[SyncCron] Iniciando sync (${origen})...`);

    // Marcar como running
    config.ultimo_estado = 'running';
    config.ultimo_inicio = inicio;
    config.ultimo_fin = null;
    config.ultimo_error = null;
    config.ultimo_resumen = null;
    await this.configRepo.save(config);

    const log = this.logRepo.create({ inicio, origen, estado: 'running' });
    await this.logRepo.save(log);

    let totalInsertados = 0;
    let totalActualizados = 0;
    let totalEliminados = 0;
    const errores: string[] = [];

    try {
      // Determinar países a sincronizar
      const paisesStr = config.paises || 'TODOS';
      const uid = await this.odoo.authenticate();

      // Obtener lista de países disponibles desde Odoo si es TODOS
      let paises: string[] = [];
      if (paisesStr === 'TODOS') {
        const companies = await this.odoo.executeKw<any[]>(
          'res.company',
          'search_read',
          [[]],
          { fields: ['name'] },
          uid,
        );
        paises = companies.map((c) => c.name);
      } else {
        paises = paisesStr.split(',').map((p) => p.trim()).filter(Boolean);
      }

      this.logger.log(`[SyncCron] Países a sincronizar: ${paises.join(', ')}`);

      for (const pais of paises) {
        try {
          const result = await this.syncPais(pais, uid);
          totalInsertados += result.insertados;
          totalActualizados += result.actualizados;
          totalEliminados += result.eliminados;
        } catch (e) {
          const msg = `Error en país "${pais}": ${e.message}`;
          this.logger.error(msg);
          errores.push(msg);
        }
      }

      const fin = new Date();
      const duracion = Math.round((fin.getTime() - inicio.getTime()) / 1000);
      const estado = errores.length > 0 ? 'parcial' : 'success';
      const resumen = `${totalInsertados} insertados, ${totalActualizados} actualizados, ${totalEliminados} eliminados`;

      // Actualizar config
      config.ultimo_estado = estado;
      config.ultimo_fin = fin;
      config.ultima_duracion_seg = duracion;
      config.ultimo_resumen = resumen;
      if (errores.length) config.ultimo_error = errores.join('\n');
      await this.configRepo.save(config);

      // Actualizar log
      log.fin = fin;
      log.duracion_seg = duracion;
      log.estado = estado;
      log.paises = paises.join(', ');
      log.insertados = totalInsertados;
      log.actualizados = totalActualizados;
      log.eliminados = totalEliminados;
      if (errores.length) log.error = errores.join('\n');
      await this.logRepo.save(log);

      this.logger.log(`[SyncCron] Finalizado en ${duracion}s — ${resumen}`);
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

      this.logger.error(`[SyncCron] Error fatal: ${e.message}`);
      throw e;
    }
  }

  // ── Sync de un país específico ───────────────────────────────────────────────

  private async syncPais(pais: string, uid: number) {
    const odooEmps = await this.odoo.executeKw<any[]>(
      'hr.employee',
      'search_read',
      [[['company_id.name', '=', pais]]],
      {
        fields: [
          'id', 'name', 'identification_id', 'barcode', 'pin',
          'job_title', 'department_id',
        ],
      },
      uid,
    );

    const dbUsers = await this.usuarioRepo.find({ where: { pais } });
    const dbMap = new Map(dbUsers.map((u) => [u.id_odoo, u]));
    const odooIds = new Set(odooEmps.map((e) => e.id));

    let insertados = 0;
    let actualizados = 0;
    let eliminados = 0;

    // ── UPSERT ──────────────────────────────────────────────────────────────
    for (const emp of odooEmps) {
      const idOdoo = emp.identification_id || emp.barcode || emp.pin || null;
      const existing = dbMap.get(emp.id);

      if (!existing) {
        // Nuevo → insertar
        await this.usuarioRepo.save({
          id: emp.id,
          id_odoo: emp.id,
          nombre: emp.name,
          identificacion: idOdoo || 'N/A',
          cargo: emp.job_title || 'Sin Cargo',
          departamento: emp.department_id ? emp.department_id[1] : 'Sin Departamento',
          pais,
        });
        insertados++;
      } else {
        // Existente → actualizar campos (sin tocar identificacion si ya tiene valor)
        const updates: Partial<Usuario> = {};

        if (existing.nombre !== emp.name) updates.nombre = emp.name;
        if (emp.job_title && existing.cargo !== emp.job_title) updates.cargo = emp.job_title;
        if (emp.department_id && existing.departamento !== emp.department_id[1])
          updates.departamento = emp.department_id[1];

        // Identificacion: solo llenar si está vacía o es N/A
        const sinId = !existing.identificacion ||
          existing.identificacion.trim() === '' ||
          existing.identificacion === 'N/A';
        if (sinId && idOdoo) updates.identificacion = idOdoo;

        if (Object.keys(updates).length > 0) {
          await this.usuarioRepo.update(existing.id, updates);
          actualizados++;
        }
      }
    }

    // ── ELIMINAR HUÉRFANOS ──────────────────────────────────────────────────
    const toDelete = dbUsers.filter((u) => !odooIds.has(u.id_odoo));
    for (const user of toDelete) {
      await this.asignacionRepo.delete({ usuario_id_odoo: user.id_odoo });
      await this.usuarioRepo.delete(user.id);
      eliminados++;
    }

    this.logger.log(
      `[SyncCron][${pais}] +${insertados} nuevos, ~${actualizados} actualizados, -${eliminados} eliminados`,
    );
    return { insertados, actualizados, eliminados };
  }
}
