import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Usuario } from './usuario.entity';

@Entity('maestro_areas')
export class Area {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nombre: string; // Ejemplo: 'CALIDAD', 'MANTENIMIENTO'

  @OneToMany(() => Usuario, (usuario) => usuario.area)
  usuarios: Usuario[];
}