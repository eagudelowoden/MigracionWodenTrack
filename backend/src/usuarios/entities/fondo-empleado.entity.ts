import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { FondoEmpleadoCorreo } from './fondo-empleado-correo.entity';

@Entity('fondo_empleados')
export class FondoEmpleado {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'nvarchar', length: 200 })
  nombre: string;

  @Column({ type: 'nvarchar', length: 150, nullable: true })
  creado_por: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => FondoEmpleadoCorreo, (c) => c.fondo, {
    cascade: true,
    eager: true,
  })
  correos_rel: FondoEmpleadoCorreo[];
}
