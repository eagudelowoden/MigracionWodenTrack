import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('reportes_falla')
export class ReporteFalla {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  empleado_id: number;

  @Column({ type: 'nvarchar', length: 200 })
  nombre: string;

  @Column({ type: 'nvarchar', length: 2000 })
  descripcion: string;

  @Column({ default: false })
  resuelto: boolean;

  @CreateDateColumn()
  fecha: Date;
}
