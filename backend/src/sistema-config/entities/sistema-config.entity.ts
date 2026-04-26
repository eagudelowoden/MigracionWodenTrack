import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('sistema_config')
export class SistemaConfig {
  @PrimaryColumn({ type: 'nvarchar', length: 100 })
  clave: string;

  @Column({ type: 'nvarchar', length: 1000 })
  valor: string;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  descripcion: string | null;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  updated_by: string | null;
}
