import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

/**
 * Seguimiento del proceso de offboarding (Paz y Salvo) para renuncias aprobadas.
 * Un registro por novedad de tipo "Renuncia" aprobada por el jefe.
 */
@Entity('paz_salvo')
export class PazSalvo {
  @PrimaryGeneratedColumn()
  id: number;

  /** Referencia a la novedad de renuncia */
  @Column({ type: 'int' })
  novedad_id: number;

  @Column({ type: 'nvarchar', length: 50 })
  cedula: string;

  @Column({ type: 'nvarchar', length: 255 })
  nombre: string;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  cargo: string | null;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  departamento: string | null;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  company: string | null;

  /** Fecha de inicio de la renuncia */
  @Column({ type: 'date', nullable: true })
  fecha_renuncia: string | null;

  // ── SST ─────────────────────────────────────────────────────────────
  @Column({ type: 'bit', default: false })
  sst_ok: boolean;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  sst_por: string | null;

  @Column({ type: 'datetime', nullable: true })
  sst_fecha: Date | null;

  /** JSON: [{key, label, ok, por, fecha, notas}] */
  @Column({ type: 'nvarchar', length: 4000, nullable: true })
  sst_items: string | null;

  // ── Capital Humano ───────────────────────────────────────────────────
  @Column({ type: 'bit', default: false })
  ch_ok: boolean;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  ch_por: string | null;

  @Column({ type: 'datetime', nullable: true })
  ch_fecha: Date | null;

  /** JSON: [{key, label, ok, por, fecha, notas}] */
  @Column({ type: 'nvarchar', length: 4000, nullable: true })
  ch_items: string | null;

  // ── IT ──────────────────────────────────────────────────────────────
  @Column({ type: 'bit', default: false })
  it_ok: boolean;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  it_por: string | null;

  @Column({ type: 'datetime', nullable: true })
  it_fecha: Date | null;

  /** JSON: [{key, label, ok, por, fecha, notas}] */
  @Column({ type: 'nvarchar', length: 4000, nullable: true })
  it_items: string | null;

  // ── Estado general ───────────────────────────────────────────────────
  @Column({ type: 'bit', default: false })
  proceso_completo: boolean;

  @Column({ type: 'datetime', nullable: true })
  fecha_completado: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
