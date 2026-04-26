import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { MallaHoraria } from './malla-horaria.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Entity('mallas_asignaciones')
export class MallaAsignacion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  usuario_id_odoo: number;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'usuario_id_odoo', referencedColumnName: 'id_odoo' })
  usuario: Usuario;

  @Column()
  malla_id: number;

  @ManyToOne(() => MallaHoraria, (m) => m.asignaciones)
  @JoinColumn({ name: 'malla_id' })
  malla: MallaHoraria;

  @Column({ type: 'date' })
  fecha_inicio: string;

  @Column({ type: 'date', nullable: true })
  fecha_fin: string;

  @Column({ nullable: true })
  asignado_por: string;

  @CreateDateColumn()
  created_at: Date;
}
