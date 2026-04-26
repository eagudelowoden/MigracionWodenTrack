import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { MallaDetalle } from './malla-detalle.entity';
import { MallaAsignacion } from './malla-asignacion.entity';

@Entity('mallas_horarias')
export class MallaHoraria {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  descripcion: string;

  @Column({ nullable: true })
  compania: string;

  @Column({ default: true })
  activa: boolean;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => MallaDetalle, (d) => d.malla, { cascade: true })
  detalles: MallaDetalle[];

  @OneToMany(() => MallaAsignacion, (a) => a.malla)
  asignaciones: MallaAsignacion[];
}
