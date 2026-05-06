import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('horas_extra_cargue')
export class HoraExtraCargue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'nvarchar', length: 50, nullable: true })
  cedula: string | null;

  @Column({ type: 'nvarchar', length: 255 })
  nombre: string;

  @Column({ type: 'date' })
  fecha: string; // YYYY-MM-DD

  // Jornada laboral (malla)
  @Column({ type: 'nvarchar', length: 10, nullable: true })
  inicio_turno: string | null;

  @Column({ type: 'nvarchar', length: 10, nullable: true })
  fin_turno: string | null;

  // Tiempo laborado real
  @Column({ type: 'nvarchar', length: 10, nullable: true })
  hora_inicio_laborado: string | null;

  @Column({ type: 'nvarchar', length: 10, nullable: true })
  hora_fin_laborado: string | null;

  // Categorías colombianas (sexagesimal)
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

  // Metadatos del cargue
  @Column({ type: 'nvarchar', length: 255, nullable: true })
  company: string | null;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  departamento: string | null;

  @Column({ type: 'int', nullable: true })
  area_id: number | null;

  @Column({ type: 'int', nullable: true })
  segmento_id: number | null;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  cargado_por: string | null;

  @Column({ type: 'bit', nullable: true })
  aprobado: boolean | null;

  @CreateDateColumn()
  created_at: Date;
}
