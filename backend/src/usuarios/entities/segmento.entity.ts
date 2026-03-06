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
//Codigo funcionando correctamente, se ha creado la entidad Segmento con una relación OneToMany hacia la entidad Usuario. Cada segmento puede tener múltiples usuarios asociados.