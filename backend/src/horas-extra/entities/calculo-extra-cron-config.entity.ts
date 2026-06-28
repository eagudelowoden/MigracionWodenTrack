import { Entity, Column, PrimaryColumn } from 'typeorm';

/**
 * Configuración del cron de cálculo de horas extra (fila única id=1).
 * Se administra desde Super Admin: activar/desactivar y hora de ejecución.
 */
@Entity('calculo_extra_cron_config')
export class CalculoExtraCronConfig {
  @PrimaryColumn({ default: 1 })
  id: number;

  /** Hora de ejecución (0-23). Por defecto 9 AM (turno nocturno ya cerró). */
  @Column({ type: 'int', default: 9 })
  hora: number;

  /** Minuto de ejecución (0-59) */
  @Column({ type: 'int', default: 0 })
  minuto: number;

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
