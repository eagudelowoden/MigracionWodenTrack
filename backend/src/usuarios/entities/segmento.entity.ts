import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  OneToMany, 
  ManyToOne, // Importante para definir al jefe
  JoinColumn  // Importante para la columna física en SQL Server
} from 'typeorm';
import { Usuario } from './usuario.entity';

@Entity('maestro_segmentos')
export class Segmento {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nombre: string; // Ejemplo: 'LOGISTICA', 'TECNOLOGIA'

  // 1. Relación para asignar al RESPONSABLE del segmento
  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'responsable_id' }) // Crea la columna responsable_id en SQL Server
  responsable: Usuario;

  // 2. Relación inversa: Los usuarios que PERTENECEN a este segmento
  @OneToMany(() => Usuario, (usuario) => usuario.segmento)
  usuarios: Usuario[];
}