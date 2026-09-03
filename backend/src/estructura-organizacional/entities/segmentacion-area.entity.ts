import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SegmentoEstructura } from './segmento-estructura.entity';
import { CentroCosto } from './centro-costo.entity';

/**
 * Asignación de segmento + centro de costo por persona — UNA fila vigente por
 * usuario (unique en usuario_id_odoo, se actualiza in-place al reasignar; sin
 * historial). Reemplaza a `Usuario.segmento_id` como fuente para el cron de
 * resumen de asistencia: ese campo se queda intacto para lo que use Permisos,
 * pero el dashboard ya no lee de ahí — lee de esta tabla.
 */
@Entity('segmentacion_areas')
export class SegmentacionArea {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  usuario_id_odoo: number;

  @Column({ type: 'int', nullable: true })
  segmento_id: number | null;

  @ManyToOne(() => SegmentoEstructura, { nullable: true })
  @JoinColumn({ name: 'segmento_id' })
  segmento: SegmentoEstructura;

  @Column({ type: 'int', nullable: true })
  centro_costo_id: number | null;

  @ManyToOne(() => CentroCosto, { nullable: true })
  @JoinColumn({ name: 'centro_costo_id' })
  centroCosto: CentroCosto;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  asignado_por: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
