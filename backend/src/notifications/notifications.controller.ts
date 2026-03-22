// notifications.controller.ts
import { Controller, Post, Get, Patch, Param, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('usuarios/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  async create(@Body() data: any) {
    return await this.notificationsService.broadcast(data);
  }

  // Para el admin: historial completo
  @Get()
  async findAll() {
    return await this.notificationsService.getHistory();
  }

  // Para la app al arrancar: el anuncio activo
  @Get('active')
  async getActive() {
    return await this.notificationsService.getActiveAnnouncement();
  }

  // Para desactivar desde el admin
  @Patch(':id/deactivate')
  async deactivate(@Param('id') id: number) {
    return await this.notificationsService.deactivate(id);
  }
}