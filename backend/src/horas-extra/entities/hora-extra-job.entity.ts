import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Cola de trabajos de cálculo de horas extra.
 *
 * En vez de calcular en vivo dentro de la API (que consume mucha RAM y, con
 * varios usuarios a la vez, la tumba), las peticiones de cálculo se ENCOLAN
 * aquí como una fila. Un proceso WORKER aparte las consume de a una, las
 * procesa con el motor por lotes y guarda el resultado. Así:
 *   - La API responde al instante (solo inserta la fila), nunca se cae.
 *   - El worker (proceso aislado) hace el trabajo pesado; si revienta, muere
 *     solo él.
 *   - El cron diario simplemente inserta una fila tipo 'cron'.
 *
 * No requiere Redis ni infraestructura extra: es una tabla más en SQL Server.
 */
@Entity('horas_extra_jobs')
@Index('IDX_hx_job_estado', ['estado'])
export class HoraExtraJob {
  @PrimaryGeneratedColumn()
  id: number;

  /** 'cron' (automático diario) | 'manual' (recálculo pedido por un usuario) */
  @Column({ type: 'nvarchar', length: 20, default: 'manual' })
  tipo: string;

  /** 'pendiente' | 'procesando' | 'completado' | 'error' */
  @Column({ type: 'nvarchar', length: 20, default: 'pendiente' })
  estado: string;

  /**
   * Parámetros del cálculo serializados en JSON:
   * { startDate, endDate, soloHoy, company, area_id, segmento_id,
   *   calculado_por, guardar }
   */
  @Column({ type: 'text', nullable: true })
  params: string | null;

  // Campos sueltos para visibilidad / filtros en la UI (además del JSON)
  @Column({ type: 'date', nullable: true })
  rango_desde: string | null;

  @Column({ type: 'date', nullable: true })
  rango_hasta: string | null;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  company: string | null;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  solicitado_por: string | null;

  // Control de reintentos
  @Column({ type: 'int', default: 0 })
  intentos: number;

  @Column({ type: 'int', default: 3 })
  max_intentos: number;

  @Column({ type: 'nvarchar', length: 2000, nullable: true })
  error_mensaje: string | null;

  /** Resumen del resultado, ej. "412 registros calculados" */
  @Column({ type: 'nvarchar', length: 500, nullable: true })
  resultado_resumen: string | null;

  /**
   * PID del proceso worker (Node) que tomó este job. Se usa para poder
   * matarlo si queda "procesando" colgado más del límite (ver
   * `recuperarColgados`), en vez de esperar a que muera solo.
   */
  @Column({ type: 'int', nullable: true })
  worker_pid: number | null;

  @Column({ type: 'datetime2', nullable: true })
  started_at: Date | null;

  @Column({ type: 'datetime2', nullable: true })
  finished_at: Date | null;

  @CreateDateColumn({ type: 'datetime2', default: () => 'SYSUTCDATETIME()' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime2', default: () => 'SYSUTCDATETIME()' })
  updated_at: Date;
}
