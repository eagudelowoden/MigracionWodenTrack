import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('correo_destinatarios')
export class CorreoDestinatario {
  @PrimaryGeneratedColumn()
  id: number;

  /** Tipo de notificación: 'novedades' | 'ausentismo' | etc. */
  @Column({ type: 'nvarchar', length: 50, default: 'novedades' })
  tipo: string;

  @Column({ type: 'nvarchar', length: 255 })
  email: string;

  @Column({ type: 'nvarchar', length: 150, nullable: true })
  creado_por: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
