// src/notifications/announcement.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('announcements')
export class Announcement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  body: string;

  @Column({ default: 'info' })
  type: string; // 'info' | 'update' | 'alert'

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;
}