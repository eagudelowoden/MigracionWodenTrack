import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('offboarding_cron_log')
export class OffboardingCronLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'datetime' })
  inicio: Date;

  @Column({ type: 'datetime', nullable: true })
  fin: Date | null;

  @Column({ type: 'int', nullable: true })
  duracion_seg: number | null;

  /** 'running' | 'success' | 'error' */
  @Column({ type: 'varchar', length: 20 })
  estado: string;

  /** Cuántos procesos pendientes encontró */
  @Column({ type: 'int', nullable: true })
  pendientes_encontrados: number | null;

  /** Cuántos correos se enviaron */
  @Column({ type: 'int', nullable: true })
  correos_enviados: number | null;

  @Column({ type: 'text', nullable: true })
  error: string | null;

  /** 'auto' | 'manual' */
  @Column({ type: 'varchar', length: 20, default: 'auto' })
  origen: string;
}
