import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Usuario } from './usuario.entity';

@Entity('permisos_departamento')
export class PermisoDepartamento {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  id_odoo: number;

  @Column()
  departamento: string;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  asignado_por: string | null;

  @UpdateDateColumn()
  fecha_modificacion: Date;

  @ManyToOne(() => Usuario, (usuario) => usuario.permisosDepartamento, {
    nullable: true,
  })
  @JoinColumn({ name: 'id_odoo', referencedColumnName: 'id_odoo' })
  usuario: Usuario;
}
