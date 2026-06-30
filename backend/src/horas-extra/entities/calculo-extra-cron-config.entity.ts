import { Entity, Column, PrimaryColumn } from 'typeorm';

/**
 * Configuración del cron de cálculo de horas extra (fila única id=1).
 * Se administra desde Super Admin: activar/desactivar y hora de ejecución.
 */
@Entity('calculo_extra_cron_config')
export class CalculoExtraCronConfig {
  @PrimaryColumn({ default: 1 })
  id: number;

  /** (Legacy) Hora única de ejecución. Se conserva por compatibilidad. */
  @Column({ type: 'int', default: 9 })
  hora: number;

  /** Minuto de ejecución (0-59) */
  @Column({ type: 'int', default: 0 })
  minuto: number;

  /** Corre CADA HORA desde esta hora (0-23). Por defecto 6 AM. */
  @Column({ type: 'int', default: 6 })
  hora_inicio: number;

  /** ...hasta esta hora (0-23). Por defecto 20 (8 PM). */
  @Column({ type: 'int', default: 20 })
  hora_fin: number;

  /** Si el cron está activo */
  @Column({ type: 'bit', default: true })
  activo: boolean;

  /**
   * Ventana de asentamiento: cuántos días hacia atrás recalcula cada corrida
   * (para recoger marcaciones tardías y correcciones). Default 3.
   */
  @Column({ type: 'int', default: 3 })
  dias_ventana: number;
}
