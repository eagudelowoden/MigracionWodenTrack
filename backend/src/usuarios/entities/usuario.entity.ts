import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { Permiso } from './permiso.entity';
import { Segmento } from './segmento.entity';
import { Area } from './area.entity';
import { PermisoDepartamento } from './permiso-departamento.entity';

@Entity('usuarios_registrados') // <--- Debe ser igual al nombre en SQL Server
export class Usuario {
  @PrimaryGeneratedColumn()
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

  @Column({ nullable: true })
  segmento_id: number;

  @ManyToOne(() => Segmento, (segmento) => segmento.usuarios, {
    nullable: true,
  })
  @JoinColumn({ name: 'segmento_id' })
  segmento: Segmento;

  @Column({ nullable: true })
  area_id: number;

  @ManyToOne(() => Area, (area) => area.usuarios, { nullable: true })
  @JoinColumn({ name: 'area_id' })
  area: Area;

  @OneToMany(() => Permiso, (permiso) => permiso.usuario)
  permisos: Permiso[];

  @OneToMany(() => PermisoDepartamento, (pd) => pd.usuario)
  permisosDepartamento: PermisoDepartamento[];
}
