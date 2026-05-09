import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('recordatorios_malla')
export class RecordatorioMalla {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'nvarchar', length: 120 })
  nombre: string;

  @Column({ type: 'nvarchar', length: 500 })
  mensaje: string;

  // JSON array de números: 0=Dom,1=Lun,...,6=Sáb  ej: "[1,2]"
  @Column({ type: 'nvarchar', length: 50 })
  dias: string;

  // "HH:mm"
  @Column({ type: 'nvarchar', length: 5 })
  hora: string;

  // 'websocket' | 'email' | 'ambos'
  @Column({ type: 'nvarchar', length: 20, default: 'websocket' })
  canal: string;

  // JSON array de {id_odoo, nombre}
  @Column({ type: 'nvarchar', length: 2000, nullable: true })
  destinatarios: string | null;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn()
  created_at: Date;
}
