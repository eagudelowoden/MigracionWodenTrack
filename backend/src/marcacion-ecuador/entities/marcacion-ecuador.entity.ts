import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('marcaciones_ecuador')
@Index('IDX_marc_ec_odoo_fecha', ['id_odoo', 'fecha'])
export class MarcacionEcuador {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  id_odoo: number;

  @Column({ type: 'nvarchar', length: 100 })
  cedula: string;

  @Column({ type: 'nvarchar', length: 255 })
  nombre: string;

  /** 'entrada' | 'salida' */
  @Column({ type: 'nvarchar', length: 10 })
  tipo: string;

  @Column({ type: 'float', nullable: true })
  latitud: number | null;

  @Column({ type: 'float', nullable: true })
  longitud: number | null;

  @Column({ type: 'nvarchar', length: 500, nullable: true })
  direccion: string | null;

  /** YYYY-MM-DD */
  @Column({ type: 'nvarchar', length: 10 })
  fecha: string;

  /** HH:mm:ss */
  @Column({ type: 'nvarchar', length: 8 })
  hora: string;

  @Column({ type: 'nvarchar', length: 255, default: 'Ecuador' })
  company: string;

  @CreateDateColumn()
  created_at: Date;
}
