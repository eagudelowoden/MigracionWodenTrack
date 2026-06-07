import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('sync_cron_config')
export class SyncCronConfig {
  @PrimaryColumn({ default: 1 })
  id: number;

  /** Hora de ejecución (0-23) */
  @Column({ type: 'int', default: 2 })
  hora: number;

  /** Minuto de ejecución (0-59) */
  @Column({ type: 'int', default: 0 })
  minuto: number;

  /** Países a sincronizar, separados por coma. 'TODOS' = todos */
  @Column({ type: 'varchar', length: 500, default: 'TODOS' })
  paises: string;

  /** Si el cron está activo */
  @Column({ type: 'bit', default: true })
  activo: boolean;

  /** Estado del último run */
  @Column({ type: 'varchar', length: 20, nullable: true })
  ultimo_estado: string | null;

  @Column({ type: 'datetime', nullable: true })
  ultimo_inicio: Date;

  @Column({ type: 'datetime', nullable: true })
  ultimo_fin: Date | null;

  /** Duración en segundos del último run */
  @Column({ type: 'int', nullable: true })
  ultima_duracion_seg: number | null;

  /** Mensaje de error del último run (si hubo) */
  @Column({ type: 'text', nullable: true })
  ultimo_error: string | null;

  /** Resumen del último run */
  @Column({ type: 'text', nullable: true })
  ultimo_resumen: string | null;
}
