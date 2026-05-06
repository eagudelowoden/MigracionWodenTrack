import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MallaHoraria } from './malla-horaria.entity';

@Entity('mallas_detalles')
export class MallaDetalle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  malla_id: number;

  @ManyToOne(() => MallaHoraria, (m) => m.detalles)
  @JoinColumn({ name: 'malla_id' })
  malla: MallaHoraria;

  @Column()
  dia_semana: number; // 0=Lun, 1=Mar, 2=Mié, 3=Jue, 4=Vie, 5=Sáb, 6=Dom

  @Column('decimal', { precision: 4, scale: 2 })
  hora_inicio: number; // 7.00 = 07:00

  @Column('decimal', { precision: 4, scale: 2 })
  hora_fin: number; // 17.00 = 17:00

  @Column({ nullable: true })
  periodo: string; // 'morning' | 'afternoon' | 'night'
}
