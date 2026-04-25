import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Usuario } from './usuario.entity';

@Entity('maestro_segmentos')
export class Segmento {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nombre: string;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  creado_por: string | null;

  @CreateDateColumn()
  creado_en: Date; // Ejemplo: 'LOGISTICA', 'TECNOLOGIA'

  // 1. Relación para asignar al RESPONSABLE del segmento
  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'responsable_id' }) // Crea la columna responsable_id en SQL Server
  responsable: Usuario;

  // 2. Relación inversa: Los usuarios que PERTENECEN a este segmento
  @OneToMany(() => Usuario, (usuario) => usuario.segmento)
  usuarios: Usuario[];
}