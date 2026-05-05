// src/novedades/entities/novedad-estado-ch.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

/**
 * Catálogo de carpetas/estados personalizados.
 * Cada módulo tiene su propio set INDEPENDIENTE:
 *   tipo = 'rrhh'         → solo visible y editable en Capital Humano
 *   tipo = 'coordinador'  → solo visible y editable en vista Jefe/Coordinador
 * El mismo nombre puede existir en distintos tipos sin conflicto.
 */
@Entity('novedad_estados_ch')
export class NovedadEstadoCh {
  @PrimaryGeneratedColumn()
  id: number;

  /** Nombre visible del estado/carpeta */
  @Column({ type: 'nvarchar', length: 100 })
  nombre: string;

  /** Clase FontAwesome (ej: "fas fa-folder", "fas fa-box-archive") */
  @Column({ type: 'nvarchar', length: 80, default: 'fas fa-folder' })
  icono: string;

  /** Color HEX (ej: "#6b7280", "#22c55e") */
  @Column({ type: 'nvarchar', length: 30, default: '#6b7280' })
  color: string;

  /** Orden de visualización en la barra de tabs */
  @Column({ type: 'int', default: 0 })
  orden: number;

  /**
   * Propietario de la carpeta:
   *   'rrhh'        → Capital Humano
   *   'coordinador' → Jefe de área / Coordinador
   */
  @Column({ type: 'nvarchar', length: 20, default: 'rrhh' })
  tipo: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
