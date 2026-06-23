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
    // Heartbeat agresivo: el servidor manda un ping cada 10s y espera el pong
    // en 5s. Así el cliente detecta una conexión muerta en ~15s (en vez de los
    // ~45s por defecto), clave detrás del proxy de IIS que mantiene el WS abierto.
    pingInterval: 10000,
    pingTimeout: 5000,
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