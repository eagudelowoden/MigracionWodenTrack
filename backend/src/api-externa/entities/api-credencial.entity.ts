import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('api_externa_credenciales')
export class ApiCredencial {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nombre: string; // Etiqueta descriptiva del cliente

  @Column({ length: 80, unique: true })
  username: string;

  @Column({ length: 256, name: 'password_hash' })
  passwordHash: string;

  @Column({ length: 72, unique: true })
  token: string; // UUID sin guiones usado como Bearer token

  @Column({ default: true })
  activa: boolean;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn: Date;

  @Column({ name: 'ultimo_uso', nullable: true, type: 'datetime' })
  ultimoUso: Date | null;
}
