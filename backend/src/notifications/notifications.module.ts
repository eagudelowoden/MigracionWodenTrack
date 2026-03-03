// src/notifications/notifications.module.ts
import { Module } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller'; // <--- Importante

@Module({
    // Agregamos el controlador aquí para que las rutas funcionen
    controllers: [NotificationsController],

    // Providers son los servicios y gateways que Nest maneja internamente
    providers: [NotificationsGateway, NotificationsService],

    // Exportamos si otros módulos necesitan usar el servicio o el gateway
    exports: [NotificationsGateway, NotificationsService]
})
export class NotificationsModule { }