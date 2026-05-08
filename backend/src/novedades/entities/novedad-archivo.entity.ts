// src/novedades/entities/novedad-archivo.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Novedad } from './novedad.entity';

@Entity('novedad_archivos')
export class NovedadArchivo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'novedad_id' })
  novedadId: number;

  @ManyToOne(() => Novedad, (n) => n.archivos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'novedad_id' })
  novedad: Novedad;

  @Column({ name: 'nombre_original', length: 255 })
  nombreOriginal: string;

  @Column({ name: 'storage_key', length: 512 })
  storageKey: string;

  @Column({ name: 'storage_mode', length: 10, default: 'local' })
  storageMode: string; // 'local' | 's3'

  @Column({ name: 'mime', length: 120, nullable: true })
  mime: string;

  @Column({ name: 'tamano', type: 'int', default: 0 })
  tamano: number; // bytes

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
