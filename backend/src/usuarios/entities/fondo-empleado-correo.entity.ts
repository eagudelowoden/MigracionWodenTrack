import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { FondoEmpleado } from './fondo-empleado.entity';

@Entity('fondo_empleado_correos')
export class FondoEmpleadoCorreo {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => FondoEmpleado, (f) => f.correos_rel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fondo_id' })
  fondo: FondoEmpleado;

  @Column({ name: 'fondo_id' })
  fondo_id: number;

  @Column({ type: 'nvarchar', length: 255 })
  email: string;

  @CreateDateColumn()
  created_at: Date;
}
