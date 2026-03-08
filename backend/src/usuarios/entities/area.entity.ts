// En area.entity.ts y segmento.entity.ts
import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  OneToMany, 
  ManyToOne, // <--- ESTE ES EL QUE TE FALTA
  JoinColumn 
} from 'typeorm';
import { Usuario } from './usuario.entity';

@Entity('maestro_areas')
export class Area {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nombre: string;

  // Relación para asignar quién es el JEFE del área
  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'responsable_id' }) 
  responsable: Usuario;

  // Relación para saber quiénes son los EMPLEADOS del área
  @OneToMany(() => Usuario, (usuario) => usuario.area)
  usuarios: Usuario[];
}