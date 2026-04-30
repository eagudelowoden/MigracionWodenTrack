import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('horas_extra')
export class HoraExtra {
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

  // Turno programado (malla)
  @Column({ type: 'nvarchar', length: 10, nullable: true })
  inicio_turno: string | null; // "07:00"

  @Column({ type: 'nvarchar', length: 10, nullable: true })
  fin_turno: string | null; // "17:00"

  // Asistencia real
  @Column({ type: 'nvarchar', length: 30, nullable: true })
  fecha_entrada: string | null; // "2026-04-27 07:01:52"

  @Column({ type: 'nvarchar', length: 30, nullable: true })
  fecha_salida: string | null;

  // Horas extra por entrada anticipada (antes del turno)
  @Column({ type: 'nvarchar', length: 30, nullable: true })
  inicio_extra_entrada: string | null; // cuando empezó la hora extra

  @Column({ type: 'nvarchar', length: 30, nullable: true })
  fin_extra_entrada: string | null; // cuando terminó (= inicio_turno)

  @Column({ type: 'int', default: 0 })
  minutos_extra_entrada: number;

  // Horas extra por salida tardía (después del turno)
  @Column({ type: 'nvarchar', length: 30, nullable: true })
  inicio_extra_salida: string | null; // cuando empezó (= fin_turno)

  @Column({ type: 'nvarchar', length: 30, nullable: true })
  fin_extra_salida: string | null; // cuando terminó

  @Column({ type: 'int', default: 0 })
  minutos_extra_salida: number;

  // Total
  @Column({ type: 'int', default: 0 })
  total_minutos_extra: number;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  calculado_por: string | null;

  @Column({ type: 'bit', default: false })
  es_dominical: boolean;

  @Column({ type: 'bit', nullable: true })
  aprobado: boolean | null;

  // Cargo del colaborador
  @Column({ type: 'nvarchar', length: 255, nullable: true })
  cargo: string | null;

  // Categorías colombianas (horas decimales sexagesimales: 30min = 0.50)
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  rn: number; // Recargo Nocturno (21:00-06:00 dentro del turno, día ordinario)

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  rndf: number; // Recargo Nocturno Día Festivo

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  rddf: number; // Recargo Diurno Día Festivo

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  hedo: number; // Horas Extra Diurnas Ordinarias

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  heno: number; // Horas Extra Nocturnas Ordinarias

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  hefd: number; // Horas Extra Festivas Diurnas

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  hefn: number; // Horas Extra Festivas Nocturnas

  @CreateDateColumn()
  created_at: Date;
}
