import { Injectable } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';

export interface NotificationLog {
    id: number;
    title: string;
    body: string;
    type: string;
    date: string;
}

@Injectable()
export class NotificationsService {
    private notificationLogs: NotificationLog[] = [];

    constructor(private readonly notificationsGateway: NotificationsGateway) { }

    async broadcast(data: any) {
        const newLog: NotificationLog = {
            id: Date.now(),
            title: data.title,
            body: data.body,
            type: data.type || 'info',
            date: new Date().toLocaleTimeString('es-CO', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            })
        };

        this.notificationLogs.unshift(newLog);

        if (this.notificationLogs.length > 15) {
            this.notificationLogs.pop();
        }

        this.notificationsGateway.sendGlobalNotification(newLog);

        return { success: true, data: newLog };
    }

    async getHistory(): Promise<NotificationLog[]> {
        return this.notificationLogs;
    }
}