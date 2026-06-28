import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * Snapshot AUTOMÁTICO de horas extra calculadas por el cron (9 AM) vía worker.
 *
 * Separada a propósito de `horas_extra`:
 *   - `calculados_extras` → la llena el cron cada noche (borra+reinserta el rango).
 *     Es la que los usuarios CONSULTAN (lectura instantánea, no toca Odoo).
 *   - `horas_extra` → flujo manual de aprobación/notificación (no la pisa el cron).
 *
 * Por eso aquí NO hay campos de aprobación/notificación: es solo el resultado
 * recalculable del cálculo.
 */
@Entity('calculados_extras')
@Index('IDX_calc_extra_fecha', ['fecha'])
@Index('IDX_calc_extra_cedula_fecha', ['cedula', 'fecha'])
export class CalculadoExtra {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'nvarchar', length: 50 })
  cedula: string;

  @Column({ type: 'nvarchar', length: 255 })
  nombre: string;

  @Column({ type: 'int', nullable: true })
  employee_id_odoo: number | null;

  @Column({ type: 'date' })
  fecha: string; // YYYY-MM-DD

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  company: string | null;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  departamento: string | null;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  cargo: string | null;

  // Turno programado (malla)
  @Column({ type: 'nvarchar', length: 10, nullable: true })
  inicio_turno: string | null;

  @Column({ type: 'nvarchar', length: 10, nullable: true })
  fin_turno: string | null;

  // Asistencia real
  @Column({ type: 'nvarchar', length: 30, nullable: true })
  fecha_entrada: string | null;

  @Column({ type: 'nvarchar', length: 30, nullable: true })
  fecha_salida: string | null;

  @Column({ type: 'bit', default: false })
  es_dominical: boolean;

  // Categorías colombianas (horas decimales: 30min = 0.50)
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  rn: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  rndf: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  rddf: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  hedo: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  heno: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  hefd: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  hefn: number;

  @Column({ type: 'int', default: 0 })
  total_minutos_extra: number;

  /** Quién/qué lo generó (ej. "Cron 9AM") */
  @Column({ type: 'nvarchar', length: 255, nullable: true })
  calculado_por: string | null;

  @CreateDateColumn()
  created_at: Date;
}
