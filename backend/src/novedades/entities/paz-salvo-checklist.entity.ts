import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('paz_salvo_checklist')
export class PazSalvoChecklist {
  @PrimaryGeneratedColumn()
  id: number;

  /** sst | ch | it */
  @Column({ type: 'nvarchar', length: 20 })
  modulo: string;

  @Column({ type: 'nvarchar', length: 500 })
  texto: string;

  @Column({ type: 'int', default: 0 })
  orden: number;

  @Column({ type: 'bit', default: true })
  activo: boolean;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  creado_por: string | null;

  @CreateDateColumn()
  creado_en: Date;
}
