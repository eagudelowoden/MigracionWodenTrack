import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('api_externa_campos')
export class ApiCampoConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  campo: string; // clave interna: 'cedula', 'nombre', etc.

  @Column({ length: 120 })
  label: string; // etiqueta visible

  @Column({ default: true })
  activo: boolean;

  @Column({ default: 0 })
  orden: number;
}
