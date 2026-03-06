import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Usuario } from './usuario.entity';

@Entity('maestro_segmentos')
export class Segmento {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nombre: string; // Ejemplo: 'LOGISTICA', 'TECNOLOGIA'

  @OneToMany(() => Usuario, (usuario) => usuario.segmento)
  usuarios: Usuario[];
}