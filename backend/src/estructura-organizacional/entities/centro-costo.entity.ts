import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

/** Maestro de centros de costo — administrado desde "Estructura Organizacional". */
@Entity('maestro_centros_costo')
export class CentroCosto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nombre: string;

  @Column({ type: 'nvarchar', length: 50, nullable: true })
  codigo: string | null;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  creado_por: string | null;

  @CreateDateColumn()
  creado_en: Date;
}
