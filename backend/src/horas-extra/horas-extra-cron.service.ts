import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { HorasExtraJobService } from './horas-extra-job.service';

/**
 * Cron diario de horas extra.
 *
 * NO calcula nada: solo ENCOLA un job. El worker (proceso aparte) lo procesa.
 * Así, ni el cálculo ni un eventual OOM tocan la API.
 *
 * Hora: 09:00 AM. El turno nocturno más tardío cierra ~06:00, así que a las 9
 * ya cerró todo con colchón. Procesa una VENTANA DE ASENTAMIENTO de los últimos
 * 3 días para recoger marcaciones tardías y correcciones de malla.
 */
@Injectable()
export class HorasExtraCronService {
  private readonly logger = new Logger(HorasExtraCronService.name);

  constructor(private readonly jobs: HorasExtraJobService) {}

  // Fecha Colombia (YYYY-MM-DD) desplazada `dias` días.
  private fechaColombia(dias: number): string {
    const ahora = new Date();
    const fmt = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const hoyStr = fmt.format(ahora); // YYYY-MM-DD en Colombia
    const [y, m, d] = hoyStr.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d + dias));
    return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
  }

  // '0 9 * * *' = todos los días a las 09:00 (hora del servidor)
  @Cron('0 9 * * *')
  async encolarCalculoDiario() {
    // Este cron solo corre en el proceso API (no en el worker)
    if (process.env.HX_WORKER === '1') return;

    const startDate = this.fechaColombia(-3); // hace 3 días (ventana de asentamiento)
    const endDate = this.fechaColombia(-1); // ayer (último día ya cerrado)

    try {
      const job = await this.jobs.encolar(
        {
          startDate,
          endDate,
          company: 'Todas',
          calculado_por: 'Cron 9AM',
          guardar: true,
        },
        { tipo: 'cron', solicitadoPor: 'Cron 9AM' },
      );
      this.logger.log(
        `Job diario encolado (#${job.id}) para ${startDate} → ${endDate}.`,
      );
    } catch (e: any) {
      this.logger.error(`No se pudo encolar el job diario: ${e?.message}`);
    }
  }
}
