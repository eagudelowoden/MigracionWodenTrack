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
  nombre: string; // "ADM-001 Colombia L-V 7-17"

  @Column({ nullable: true })
  descripcion: string;

  @Column({ nullable: true })
  compania: string; // "(CO) WODEN COLOMBIA SAS"

  @Column({ default: true })
  activa: boolean;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => MallaDetalle, (d) => d.malla, { cascade: true })
  detalles: MallaDetalle[];

  @OneToMany(() => MallaAsignacion, (a) => a.malla)
  asignaciones: MallaAsignacion[];
}
