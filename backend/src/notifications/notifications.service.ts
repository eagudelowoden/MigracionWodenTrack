// notifications.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement } from './entities/notificacion.entity';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Announcement)
    private announcementRepo: Repository<Announcement>,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  // Crear y emitir por socket
  async broadcast(data: any) {
    const announcement = this.announcementRepo.create({
      title: data.title,
      body: data.body,
      type: data.type || 'info',
      is_active: true,
    });

    const saved = await this.announcementRepo.save(announcement);
    this.notificationsGateway.sendGlobalNotification(saved);

    return { success: true, data: saved };
  }

  // El que se usa al cargar la app: devuelve el anuncio activo más reciente
  async getActiveAnnouncement(): Promise<Announcement | null> {
    return await this.announcementRepo.findOne({
      where: { is_active: true },
      order: { created_at: 'DESC' },
    });
  }

  // Historial para los logs del admin
  async getHistory(): Promise<Announcement[]> {
    return await this.announcementRepo.find({
      order: { created_at: 'DESC' },
      take: 15,
    });
  }
  async deactivateAll() {
    await this.announcementRepo.update(
      { is_active: true },
      { is_active: false },
    );
    this.notificationsGateway.sendGlobalNotification({ is_active: false });
    return { success: true };
  }

  // Desactivar un anuncio
  async deactivate(id: number) {
    await this.announcementRepo.update(id, { is_active: false });
    // Emite null para que los clientes limpien el banner
    this.notificationsGateway.sendGlobalNotification({ id, is_active: false });
    return { success: true };
  }
}
