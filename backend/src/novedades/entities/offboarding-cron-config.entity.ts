import { Entity, PrimaryColumn, Column } from 'typeorm';

/** Configuración singleton (id siempre = 1) del cron de offboarding */
@Entity('offboarding_cron_config')
export class OffboardingCronConfig {
  @PrimaryColumn({ type: 'int', default: 1 })
  id: number;

  /** Hora en que se ejecuta el cron (0-23) */
  @Column({ type: 'int', default: 8 })
  hora: number;

  /** Minuto en que se ejecuta el cron (0-59) */
  @Column({ type: 'int', default: 0 })
  minuto: number;

  /** Horas sin respuesta antes de enviar recordatorio */
  @Column({ type: 'int', default: 24 })
  horas_espera: number;

  /** Correos de destino separados por coma */
  @Column({ type: 'varchar', length: 1000, default: '' })
  correos: string;

  /** Si el cron está activo */
  @Column({ type: 'bit', default: true })
  activo: boolean;

  /** Estado del último run */
  @Column({ type: 'varchar', length: 20, nullable: true })
  ultimo_estado: string | null;

  @Column({ type: 'datetime', nullable: true })
  ultimo_inicio: Date | null;

  @Column({ type: 'datetime', nullable: true })
  ultimo_fin: Date | null;

  @Column({ type: 'int', nullable: true })
  ultima_duracion_seg: number | null;

  @Column({ type: 'text', nullable: true })
  ultimo_error: string | null;

  @Column({ type: 'text', nullable: true })
  ultimo_resumen: string | null;
}
