import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('sesiones_activas')
export class SesionActiva {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  id_odoo: number;

  @Column({ type: 'nvarchar', length: 200 })
  nombre: string;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  ip_address: string | null;

  @Column({ type: 'nvarchar', length: 512, nullable: true })
  user_agent: string | null;

  @Column({ type: 'nvarchar', length: 60, nullable: true })
  device_type: string | null;

  @Column({ type: 'nvarchar', length: 200, nullable: true })
  socket_id: string | null;

  @Column({ default: true })
  activa: boolean;

  @CreateDateColumn()
  connected_at: Date;

  @UpdateDateColumn()
  last_seen_at: Date;
}
