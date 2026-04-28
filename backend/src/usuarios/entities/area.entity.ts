// En area.entity.ts y segmento.entity.ts
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

@Entity('maestro_areas')
export class Area {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nombre: string;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  departamento: string | null;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  creado_por: string | null;

  @CreateDateColumn()
  creado_en: Date;

  // Relación para asignar quién es el JEFE del área
  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'responsable_id' }) 
  responsable: Usuario;

  // Relación para saber quiénes son los EMPLEADOS del área
  @OneToMany(() => Usuario, (usuario) => usuario.area)
  usuarios: Usuario[];
}