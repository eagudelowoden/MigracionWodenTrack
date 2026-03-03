// src/notifications/notifications.gateway.ts
import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    MessageBody
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
    cors: {
        origin: '*', // En producción pon la URL de tu frontend Vue
    },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    @SubscribeMessage('broadcast_update')
    handleBroadcast(@MessageBody() data: any) {
        // CORRECTO: server.emit envía a TODO EL MUNDO (incluyendo otras pestañas)
        this.server.emit('onNotification', data);
    }
    // Se ejecuta cuando un usuario se conecta
    handleConnection(client: Socket) {
        console.log(`Cliente conectado: ${client.id}`);
    }

    // Se ejecuta cuando un usuario se desconecta
    handleDisconnect(client: Socket) {
        console.log(`Cliente desconectado: ${client.id}`);
    }

    // Este es el método que llamarás desde tus servicios para emitir a todos
    sendGlobalNotification(payload: any) {
        this.server.emit('onNotification', payload);
    }
}