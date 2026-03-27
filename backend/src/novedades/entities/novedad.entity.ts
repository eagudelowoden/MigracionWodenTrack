// src/novedades/entities/novedad.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('novedades')
export class Novedad {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 180 })
  nombre: string;

  @Column({ length: 20 })
  cedula: string;

  @Column('text')
  descripcion: string;

  @Column({ type: 'text', default: '' })
  tipificacion: string;

  @Column({ name: 'fecha_inicio', type: 'date' })
  fechaInicio: string;

  @Column({ name: 'fecha_fin', type: 'date' })
  fechaFin: string;

  @Column({ name: 'soporte_nombre_original', length: 255 })
  soporteNombreOriginal: string;

  @Column({ name: 'soporte_storage_key', length: 512 })
  soporteStorageKey: string;

  @Column({ name: 'soporte_storage_mode', length: 10, default: 'local' })
  soporteStorageMode: string; // 'local' | 's3'

  @Column({ name: 'soporte_mime', length: 120, nullable: true })
  soporteMime: string;

  @Column({ name: 'creado_por', nullable: true })
  creadoPor: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
