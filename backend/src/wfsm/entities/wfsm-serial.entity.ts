import { Entity, PrimaryColumn, Column, Index, UpdateDateColumn } from 'typeorm';

@Entity('wfsm_seriales_recuperados')
@Index(['fecha', 'cedula_cliente'])
@Index(['fecha', 'agente_campo'])
export class WfsmSerial {
  @PrimaryColumn({ type: 'bigint' })
  id_visita: number;

  // Fecha (YYYY-MM-DD) usada para agrupar el día consultado a WFS.
  @Column({ type: 'nvarchar', length: 10 })
  fecha: string;

  @Column({ type: 'nvarchar', length: 50, nullable: true })
  cedula_cliente: string | null;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  agente_campo: string | null;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  estatus: string | null;

  // Registro completo tal como lo devuelve WFS, para no perder ningún campo.
  @Column({ type: 'nvarchar', length: 'MAX' })
  datos: string;

  @UpdateDateColumn()
  actualizado_en: Date;
}
