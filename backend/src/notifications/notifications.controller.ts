// src/notifications/notifications.controller.ts
import { Controller, Post, Body, Get } from '@nestjs/common';
import { NotificationsService, NotificationLog } from './notifications.service'; // <--- IMPORTANTE

@Controller('usuarios/notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    async findAll(): Promise<NotificationLog[]> {
        return await this.notificationsService.getHistory();
    }

    @Post()
    async create(@Body() data: any) {
        return await this.notificationsService.broadcast(data);
    }
}