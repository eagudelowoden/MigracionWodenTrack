import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { WfsmService } from './wfsm.service';

const CRON_JOB_NAME = 'wfsm-sync-seriales';

/**
 * Mantiene fresca la caché de seriales recuperados sin que nadie tenga que
 * esperar.
 *
 * Por qué existe: WFS solo filtra por cédula de cliente; cualquier otra
 * búsqueda obliga a traer el día completo (~24 MB, ~8 s). Por eso la consulta
 * se sirve desde la tabla wfsm_seriales_recuperados. Pero esa tabla solo se
 * llenaba cuando un usuario esperaba la descarga, así que los días nuevos
 * llegaban vacíos a la primera consulta.
 *
 * Este cron la llena de madrugada, cuando nadie está esperando.
 *
 * No hay sincronización incremental: el parámetro visita/min_actualizacion de
 * la API filtra de verdad, pero el campo está casi siempre vacío (pedido el
 * 2026-09-12 desde el inicio de ese mismo día devolvió 0 de 5.442 registros),
 * así que usarlo como marca de agua dejaría los días incompletos. Cada refresco
 * baja el día entero, y por eso solo se refrescan los días recientes.
 *
 * Variables de entorno (todas opcionales):
 *   WFSM_SYNC_CRON       expresión cron. Por defecto '20 2 * * *' (2:20 a. m.)
 *   WFSM_SYNC_DIAS         ventana de días que se cubre hacia atrás. Def. 30
 *   WFSM_SYNC_DIAS_FRESCOS días recientes que SIEMPRE se re-descargan (los
 *                          demás solo si nunca se cachearon). Def. 3
 *   WFSM_RETENCION_DIAS  días que se conservan en caché. Def. 30 (un mes:
 *                        se trae la ventana y se purga lo anterior). 0 = no purgar
 *   WFSM_SYNC_ACTIVO     'false' para desactivar el cron por completo
 */
@Injectable()
export class WfsmSyncCronService implements OnModuleInit {
  private readonly logger = new Logger(WfsmSyncCronService.name);
  private enCurso = false;

  constructor(
    private readonly config: ConfigService,
    private readonly wfsm: WfsmService,
    private readonly scheduler: SchedulerRegistry,
  ) {}

  onModuleInit() {
    // El worker no registra crons (solo procesa su cola).
    if (process.env.HX_WORKER === '1') return;

    if (String(this.config.get('WFSM_SYNC_ACTIVO') ?? 'true').toLowerCase() === 'false') {
      this.logger.log('Cron de sincronización WFS desactivado por configuración.');
      return;
    }

    // Igual que el resto de crons del proyecto: un problema aquí no puede
    // tumbar el arranque de toda la API.
    try {
      const expresion = this.config.get<string>('WFSM_SYNC_CRON') ?? '20 2 * * *';
      // El callback del cron debe devolver void, y cualquier rechazo suelto
      // aquí sería un unhandledRejection que tumba el proceso: se atrapa.
      const job = new CronJob(expresion, () => {
        void this.ejecutar().catch((e: any) =>
          this.logger.error(`Sincronización WFS fallida: ${e?.message}`),
        );
      });
      this.scheduler.addCronJob(CRON_JOB_NAME, job as any);
      job.start();
      this.logger.log(`Cron de sincronización WFS registrado (${expresion}).`);
    } catch (e: any) {
      this.logger.error(
        `No se pudo registrar el cron de WFS (la API sigue arrancando igual): ${e?.message}`,
      );
    }
  }

  /** Ejecuta la pasada completa. Público para poder dispararlo a mano. */
  async ejecutar(): Promise<{ dias: number; purgadas: number }> {
    // Si la corrida anterior sigue viva (WFS lento, ventana grande), no se
    // encima otra: serían descargas duplicadas sobre su API.
    if (this.enCurso) {
      this.logger.warn('Ya hay una sincronización en curso; se omite esta corrida.');
      return { dias: 0, purgadas: 0 };
    }
    this.enCurso = true;

    const dias = Number(this.config.get('WFSM_SYNC_DIAS') ?? 30);
    const frescos = Number(this.config.get('WFSM_SYNC_DIAS_FRESCOS') ?? 3);
    const retencion = Number(this.config.get('WFSM_RETENCION_DIAS') ?? 30);
    const inicio = Date.now();
    let sincronizados = 0;

    try {
      // De la fecha más reciente hacia atrás: si algo falla a mitad, lo que
      // alcanzó a quedar fresco es lo que más se consulta.
      const fechas = Array.from({ length: dias }, (_, i) => this.fechaColombia(i));

      // Cada refresco baja el día completo (~24 MB): no hay incremental posible
      // en esta API. Por eso solo se re-descargan los días recientes, que aún
      // reciben cierres; los más viejos únicamente si nunca se cachearon.
      const yaEnCache = await this.wfsm.fechasConCache(fechas);

      for (let i = 0; i < fechas.length; i++) {
        const fecha = fechas[i];
        if (i >= frescos && yaEnCache.has(fecha)) continue;

        try {
          // En serie, nunca en paralelo: un día completo son ~24 MB desde WFS.
          await this.wfsm.sincronizarDia(fecha);
          sincronizados++;
        } catch (e: any) {
          // Un día que falle no puede abortar la ventana entera.
          this.logger.error(`Falló la sincronización de ${fecha}: ${e?.message}`);
        }
      }

      let purgadas = 0;
      if (retencion > 0) {
        try {
          purgadas = await this.wfsm.purgarAntiguos(retencion);
        } catch (e: any) {
          this.logger.error(`Falló la purga de caché: ${e?.message}`);
        }
      }

      this.logger.log(
        `Sincronización WFS lista: ${sincronizados}/${dias} días en ${((Date.now() - inicio) / 1000).toFixed(1)} s` +
          (purgadas ? `, ${purgadas} filas purgadas` : ''),
      );
      return { dias: sincronizados, purgadas };
    } finally {
      this.enCurso = false;
    }
  }

  /** Fecha YYYY-MM-DD de hace `atras` días en hora Colombia (UTC-5). */
  private fechaColombia(atras: number): string {
    return new Date(Date.now() - 5 * 60 * 60 * 1000 - atras * 86400000)
      .toISOString()
      .split('T')[0];
  }
}
