import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Usuario } from './usuario.entity';

@Entity('usuarios_permisos')
@Unique(['usuario_id_odoo', 'modulos']) // Refuerzo de seguridad a nivel código
export class Permiso {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  usuario_id_odoo: number;

  @Column()
  modulos: string; // Ej: 'admin.mallas', 'super.usuarios'

  @Column({ default: 'admin' })
  nivel_acceso: string;

  @Column({ nullable: true })
  asignado_por: string;

  // Muchos permisos pertenecen a UN usuario
  @ManyToOne(() => Usuario, (usuario) => usuario.permisos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id_odoo', referencedColumnName: 'id_odoo' })
  usuario: Usuario;
}