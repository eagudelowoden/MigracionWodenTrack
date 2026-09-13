import { Entity, PrimaryColumn, Column, Index, UpdateDateColumn } from 'typeorm';

@Entity('wfsm_seriales_recuperados')
@Index(['fecha', 'cedula_cliente'])
@Index(['fecha', 'agente_campo'])
@Index(['fecha', 'documento_agente'])
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

  // Cédula del AGENTE de campo. En WFS el campo se llama documento_identidad,
  // que despista: NO es el documento del cliente (ese es cedula_cliente).
  // Comprobado sobre un día completo: documento_identidad tiene exactamente
  // tantos valores distintos como agentes (224) y ninguno se repite entre dos
  // agentes, mientras cedula_cliente tiene 4.884 valores distintos.
  @Column({ type: 'nvarchar', length: 50, nullable: true })
  documento_agente: string | null;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  estatus: string | null;

  // Link al comprobante (PDF/imagen) que ya viene listo desde WFS.
  @Column({ type: 'nvarchar', length: 500, nullable: true })
  comprobante_link: string | null;

  // Registro completo tal como lo devuelve WFS, para no perder ningún campo.
  @Column({ type: 'nvarchar', length: 'MAX' })
  datos: string;

  @UpdateDateColumn()
  actualizado_en: Date;
}
