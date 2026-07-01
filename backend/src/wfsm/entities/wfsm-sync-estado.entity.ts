import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('wfsm_sync_estado')
export class WfsmSyncEstado {
  // Fecha (YYYY-MM-DD) sincronizada.
  @PrimaryColumn({ type: 'nvarchar', length: 10 })
  fecha: string;

  @Column({ type: 'datetime' })
  ultima_sync_en: Date;
}
