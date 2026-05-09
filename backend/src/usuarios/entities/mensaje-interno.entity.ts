import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('mensajes_internos')
export class MensajeInterno {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  de_id_odoo: number;

  @Column({ type: 'nvarchar', length: 200 })
  de_nombre: string;

  @Column({ type: 'int', nullable: true })
  para_id_odoo: number | null;

  @Column({ type: 'nvarchar', length: 200, nullable: true })
  para_nombre: string | null;

  @Column({ type: 'nvarchar', length: 1000 })
  contenido: string;

  @Column({ default: false })
  leido: boolean;

  @Column({ type: 'nvarchar', length: 50, default: 'superadmin' })
  tipo: string; // 'superadmin' | 'jefe'

  @CreateDateColumn()
  created_at: Date;
}
