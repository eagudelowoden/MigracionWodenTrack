import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { MallaHoraria } from './malla-horaria.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Entity('mallas_asignaciones')
// Acelera la búsqueda de la malla vigente por empleado (WHERE usuario_id_odoo IN (...) AND actual = 1)
@Index('IDX_asignacion_usuario_actual', ['usuario_id_odoo', 'actual'])
// Acelera el reporte por departamento (WHERE actual = 1 sobre todo el histórico)
@Index('IDX_asignacion_actual', ['actual'])
export class MallaAsignacion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  usuario_id_odoo: number; // FK a hr.employee id_odoo

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'usuario_id_odoo', referencedColumnName: 'id_odoo' })
  usuario: Usuario;

  @Column()
  malla_id: number;

  @ManyToOne(() => MallaHoraria, (m) => m.asignaciones)
  @JoinColumn({ name: 'malla_id' })
  malla: MallaHoraria;

  @Column({ type: 'date' })
  fecha_inicio: string; // desde cuándo aplica esta malla

  @Column({ type: 'date', nullable: true })
  fecha_fin: string | null;

  @Column({ type: 'bit', default: false })
  actual: boolean;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  asignado_por: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
