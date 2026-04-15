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
  @Get('history')
  getHistory() {
    return this.notificationsService.getHistory();
  }

  // Para la app al arrancar: el anuncio activo
  @Get('active')
  async getActive() {
    return await this.notificationsService.getActiveAnnouncement();
  }

  @Post('deactivate-all') // 👈 este debe ir ANTES de :id
  deactivateAll() {
    return this.notificationsService.deactivateAll();
  }

  @Post(':id/deactivate') // 👈 este va después
  deactivate(@Param('id') id: number) {
    return this.notificationsService.deactivate(id);
  }
}
