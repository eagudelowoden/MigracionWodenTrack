import { Entity, PrimaryGeneratedColumn, Column, Index, UpdateDateColumn } from 'typeorm';

@Entity('wfsm_seriales_recuperados')
@Index(['fecha', 'cedula_cliente'])
@Index(['fecha', 'agente_campo'])
@Index(['fecha', 'documento_agente'])
@Index(['id_visita'])
export class WfsmSerial {
  // Llave subrogada. NO se usa id_visita como PK: una misma visita recupera
  // varios equipos y WFS devuelve una fila por serial. Con id_visita de llave,
  // todos menos uno chocaban y se perdían (medido el 2026-09-12: 5.442
  // registros de la API colapsaban a 2.513 filas; una visita con 45 seriales
  // guardaba 1).
  @PrimaryGeneratedColumn()
  id: number;

  // Identificador de la visita en WFS. Se repite entre filas: una por serial.
  @Column({ type: 'bigint' })
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
