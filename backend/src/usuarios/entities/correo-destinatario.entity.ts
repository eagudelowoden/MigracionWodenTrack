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

  /** Tipo de notificación: 'novedades' | 'capital_humano' | 'coordinador' | etc. */
  @Column({ type: 'nvarchar', length: 50, default: 'novedades' })
  tipo: string;

  @Column({ type: 'nvarchar', length: 255 })
  email: string;

  /** Para tipo='coordinador': departamento o segmento al que aplica este correo */
  @Column({ type: 'nvarchar', length: 255, nullable: true })
  segmento: string | null;

  @Column({ type: 'nvarchar', length: 150, nullable: true })
  creado_por: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
