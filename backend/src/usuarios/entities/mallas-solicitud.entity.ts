import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('mallas_solicitudes')
export class MallasSolicitud {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  solicitante_id_odoo: number;

  @Column({ type: 'nvarchar', length: 200 })
  solicitante_nombre: string;

  @Column({ type: 'nvarchar', length: 200, nullable: true })
  area_nombre: string | null;

  @Column({ type: 'nvarchar', length: 200, nullable: true })
  segmento_nombre: string | null;

  @Column({ type: 'nvarchar', length: 500, nullable: true })
  mensaje: string | null;

  @Column({ type: 'nvarchar', length: 20, default: 'pendiente' })
  estado: string; // pendiente | aprobado | rechazado

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  atendido_por: string | null;

  @Column({ type: 'datetime', nullable: true })
  fecha_atencion: Date | null;

  @CreateDateColumn()
  created_at: Date;
}
