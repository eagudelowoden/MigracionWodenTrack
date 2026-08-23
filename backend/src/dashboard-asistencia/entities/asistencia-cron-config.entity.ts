import { Entity, Column, PrimaryColumn } from 'typeorm';

/**
 * Configuración del cron de resumen diario de asistencia (fila única id=1).
 * Corre UNA vez al día (no cada hora, a diferencia del cron de horas extra):
 * calcula "ayer" y lo guarda en asistencia_diaria_resumen.
 */
@Entity('asistencia_cron_config')
export class AsistenciaCronConfig {
  @PrimaryColumn({ default: 1 })
  id: number;

  @Column({ type: 'int', default: 3 })
  hora: number; // 0-23, hora Colombia

  @Column({ type: 'int', default: 0 })
  minuto: number;

  @Column({ type: 'bit', default: true })
  activo: boolean;

  @Column({ type: 'nvarchar', length: 255, default: 'Todas' })
  company: string;

  /** Cuántos días hacia atrás recalcula cada corrida (ventana de asentamiento). */
  @Column({ type: 'int', default: 2 })
  dias_ventana: number;

  @Column({ type: 'nvarchar', length: 10, nullable: true })
  ultima_corrida_fecha: string | null;

  /**
   * Rango fijo opcional (YYYY-MM-DD). Si ambos están definidos, la corrida
   * automática SIEMPRE recalcula ese rango exacto en vez de la ventana móvil
   * "últimos N días" — útil para forzar el recálculo continuo de un histórico
   * puntual (ej. mientras se corrige un problema de datos de un mes pasado).
   */
  @Column({ type: 'nvarchar', length: 10, nullable: true })
  rango_fijo_desde: string | null;

  @Column({ type: 'nvarchar', length: 10, nullable: true })
  rango_fijo_hasta: string | null;
}
