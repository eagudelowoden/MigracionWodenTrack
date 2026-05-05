// src/novedades/entities/novedad-estado-ch.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

/**
 * Catálogo de estados personalizados que el equipo de Capital Humano
 * puede crear libremente para categorizar las novedades.
 * Ejemplos: "Enviada a nómina", "Pendiente documentos", "Archivada", etc.
 */
@Entity('novedad_estados_ch')
export class NovedadEstadoCh {
  @PrimaryGeneratedColumn()
  id: number;

  /** Nombre visible del estado, único en la tabla */
  @Column({ length: 100, unique: true })
  nombre: string;

  /** Clase FontAwesome (ej: "fas fa-folder", "fas fa-box-archive") */
  @Column({ length: 80, default: 'fas fa-folder' })
  icono: string;

  /** Color HEX o Tailwind-safe color (ej: "#6b7280", "#22c55e") */
  @Column({ length: 30, default: '#6b7280' })
  color: string;

  /** Orden de visualización en la barra de tabs */
  @Column({ type: 'int', default: 0 })
  orden: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
