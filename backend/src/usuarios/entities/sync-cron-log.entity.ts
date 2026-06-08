import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('sync_cron_log')
export class SyncCronLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'datetime' })
  inicio: Date;

  @Column({ type: 'datetime', nullable: true })
  fin: Date;

  @Column({ type: 'int', nullable: true })
  duracion_seg: number;

  /** 'success' | 'error' | 'parcial' */
  @Column({ type: 'varchar', length: 20 })
  estado: string;

  /** Países procesados */
  @Column({ type: 'varchar', length: 500, nullable: true })
  paises: string;

  @Column({ type: 'int', nullable: true })
  insertados: number;

  @Column({ type: 'int', nullable: true })
  actualizados: number;

  @Column({ type: 'int', nullable: true })
  eliminados: number;

  @Column({ type: 'text', nullable: true })
  error: string;

  /** 'auto' = cron nocturno | 'manual' = ejecutado desde UI */
  @Column({ default: 'auto' })
  origen: string;
}
