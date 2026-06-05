import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('modulos_disponibles')
export class ModuloDisponible {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'nvarchar', length: 100, unique: true })
  slug: string;

  @Column({ type: 'nvarchar', length: 100 })
  nombre: string;

  @Column({ type: 'nvarchar', length: 500, nullable: true })
  descripcion: string | null;

  @Column({ type: 'nvarchar', length: 50 })
  grupo: string;

  @Column({ type: 'nvarchar', length: 100 })
  grupo_label: string;

  @Column({ type: 'nvarchar', length: 80, nullable: true })
  grupo_icon: string | null;

  @Column({ type: 'int', default: 0 })
  orden: number;

  @Column({ default: true })
  activo: boolean;

  @Column({ default: false })
  es_scope: boolean;

  @Column({ default: false })
  es_base: boolean;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  creado_por: string | null;

  @CreateDateColumn()
  fecha_creacion: Date;
}
