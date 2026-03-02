import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';
import { Permiso } from './permiso.entity';

@Entity('usuarios_registrados') // <--- Debe ser igual al nombre en SQL Server
export class Usuario {
  @PrimaryColumn()
  id: number;

  @Column({ unique: true })
  id_odoo: number;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  identificacion: string;

  @Column({ nullable: true })
  cargo: string;

  @Column()
  pais: string;

  @Column({ nullable: true })
  departamento: string;

  @Column({ default: true })
  is_active: boolean;

  @OneToMany(() => Permiso, (permiso) => permiso.usuario)
  permisos: Permiso[];
}