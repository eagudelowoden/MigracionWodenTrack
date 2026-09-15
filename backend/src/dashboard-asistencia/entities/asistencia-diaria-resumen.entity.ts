import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm';

export type EstadoAsistenciaDiaria = 'PUNTUAL' | 'TARDE' | 'AUSENTE' | 'INCOMPLETO' | 'NO_PROGRAMADO';

/**
 * Una fila por EMPLEADO PROGRAMADO x DÍA (no solo por quien marcó — así se
 * pueden detectar ausencias reales). La llena el cron/worker de resumen de
 * asistencia (`AsistenciaResumenService`), nunca la API en una petición en
 * vivo. El dashboard de asistencia solo hace SELECT contra esta tabla.
 */
@Entity('asistencia_diaria_resumen')
@Unique('UQ_asistencia_dia_cedula_fecha', ['cedula', 'fecha', 'company'])
@Index('IDX_asistencia_dia_fecha', ['fecha'])
@Index('IDX_asistencia_dia_departamento', ['departamento'])
@Index('IDX_asistencia_dia_segmento', ['segmento_nombre'])
export class AsistenciaDiariaResumen {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'nvarchar', length: 50 })
  cedula: string;

  @Column({ type: 'nvarchar', length: 255 })
  nombre: string;

  @Column({ type: 'int', nullable: true })
  employee_id_odoo: number | null;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  departamento: string | null;

  // Segmentación propia (maestro_segmentos), cruzada por id_odoo/cédula contra
  // usuarios_registrados — independiente del department_id que reporta Odoo.
  // Null si el empleado no tiene segmento asignado en esa fecha.
  @Column({ type: 'int', nullable: true })
  segmento_id: number | null;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  segmento_nombre: string | null;

  @Column({ type: 'int', nullable: true })
  centro_costo_id: number | null;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  centro_costo_nombre: string | null;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  company: string | null;

  @Column({ type: 'date' })
  fecha: string; // YYYY-MM-DD

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  hora_programada: number | null; // 7.00 = 07:00, de la malla vigente ese día

  @Column({ type: 'nvarchar', length: 30, nullable: true })
  hora_entrada: string | null; // "2026-08-27 07:03:00" (local Colombia)

  @Column({ type: 'nvarchar', length: 30, nullable: true })
  hora_salida: string | null;

  @Column({ type: 'int', nullable: true })
  minutos_tarde: number | null; // null si no aplica (ausente/no programado/puntual)

  @Column({ type: 'nvarchar', length: 20 })
  estado: EstadoAsistenciaDiaria;

  @Column({ type: 'bit', nullable: true })
  ausencia_justificada: boolean | null;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  novedad_tipificacion: string | null;

  @Column({ type: 'int', nullable: true })
  horas_extra_id: number | null; // referencia lógica a horas_extra.id (mismo cedula+fecha), sin FK física

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
