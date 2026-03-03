import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('global_announcements')
export class Announcement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  body: string;

  @Column()
  type: string;

  @Column({ default: false })
  active: boolean;

  @UpdateDateColumn()
  updated_at: Date;
}