import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
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

  @ManyToOne(() => Usuario, (usuario) => usuario.permisosDepartamento, {
    nullable: true,
  })
  @JoinColumn({ name: 'id_odoo', referencedColumnName: 'id_odoo' })
  usuario: Usuario;
}
