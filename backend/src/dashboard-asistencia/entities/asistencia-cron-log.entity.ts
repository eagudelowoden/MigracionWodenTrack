import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

/**
 * Historial de corridas del resumen nocturno de asistencia — lo que permite
 * al Super Admin ver si una ejecución está pendiente/procesando/completada o
 * si falló (antes de esto, un fallo del worker no dejaba ningún rastro visible).
 */
@Entity('asistencia_cron_log')
export class AsistenciaCronLog {
  @PrimaryGeneratedColumn()
  id: number;

  /** 'cron' (automático) | 'manual' (botón "Ejecutar ahora") */
  @Column({ type: 'varchar', length: 20 })
  tipo: string;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  company: string | null;

  @Column({ type: 'nvarchar', length: 10, nullable: true })
  rango_desde: string | null;

  @Column({ type: 'nvarchar', length: 10, nullable: true })
  rango_hasta: string | null;

  /** 'procesando' | 'completado' | 'error' */
  @Column({ type: 'varchar', length: 20, default: 'procesando' })
  estado: string;

  @Column({ type: 'int', nullable: true })
  total_filas: number | null;

  @Column({ type: 'text', nullable: true })
  error_mensaje: string | null;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'datetime2', nullable: true })
  finalizado_at: Date | null;
}
