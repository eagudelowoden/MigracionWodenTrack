import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SesionActiva } from './entities/sesion-activa.entity';
import { MensajeInterno } from './entities/mensaje-interno.entity';

interface JoinPayload {
  idOdoo: number;
  nombre: string;
  isSuperAdmin?: boolean;
}

interface MessagePayload {
  paraIdOdoo: number | null; // null = broadcast a todos
  contenido: string;
}

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/interno' })
export class InternoGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  // socketId → id_odoo
  private readonly socketUser = new Map<string, number>();
  // id_odoo → socketId
  private readonly userSocket = new Map<number, string>();

  constructor(
    @InjectRepository(SesionActiva)
    private readonly sesionRepo: Repository<SesionActiva>,
    @InjectRepository(MensajeInterno)
    private readonly mensajeRepo: Repository<MensajeInterno>,
  ) {}

  handleConnection(client: Socket) {
    // Connection registered; user info arrives via 'join' event
  }

  async handleDisconnect(client: Socket) {
    const idOdoo = this.socketUser.get(client.id);
    if (idOdoo !== undefined) {
      this.socketUser.delete(client.id);
      this.userSocket.delete(idOdoo);
      await this.sesionRepo.update({ socket_id: client.id }, { activa: false, socket_id: null });
      this.server.emit('sessions-updated');
    }
  }

  @SubscribeMessage('join')
  async onJoin(@ConnectedSocket() client: Socket, @MessageBody() payload: JoinPayload) {
    const { idOdoo, nombre } = payload;
    if (!idOdoo) return;

    const ip = (client.handshake.headers['x-forwarded-for'] as string)?.split(',')[0].trim()
      || client.handshake.address;
    const userAgent = client.handshake.headers['user-agent'] || null;
    const deviceType = this.detectDevice(userAgent || '');

    // Desactivar sesión anterior si existía
    await this.sesionRepo.update({ id_odoo: idOdoo }, { activa: false, socket_id: null });

    const sesion = this.sesionRepo.create({
      id_odoo: idOdoo,
      nombre,
      ip_address: ip,
      user_agent: userAgent,
      device_type: deviceType,
      socket_id: client.id,
      activa: true,
    });
    await this.sesionRepo.save(sesion);

    this.socketUser.set(client.id, idOdoo);
    this.userSocket.set(idOdoo, client.id);

    this.server.emit('sessions-updated');
    client.emit('joined', { ok: true });
  }

  @SubscribeMessage('send-message')
  async onSendMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: MessagePayload & { deIdOdoo: number; deNombre: string; paraNombre?: string }) {
    const { deIdOdoo, deNombre, paraIdOdoo, paraNombre, contenido } = payload;
    if (!contenido?.trim()) return;

    const tipo = deIdOdoo === 0 ? 'superadmin' : 'jefe';

    const msg = this.mensajeRepo.create({
      de_id_odoo: deIdOdoo,
      de_nombre: deNombre,
      para_id_odoo: paraIdOdoo ?? null,
      para_nombre: paraNombre ?? null,
      contenido: contenido.trim(),
      leido: false,
      tipo,
    });
    const saved = await this.mensajeRepo.save(msg);

    const evento = { ...saved };

    if (paraIdOdoo === null) {
      // Broadcast a todos
      this.server.emit('new-message', evento);
    } else {
      // Enviar al destinatario si está conectado
      const targetSocket = this.userSocket.get(paraIdOdoo);
      if (targetSocket) {
        this.server.to(targetSocket).emit('new-message', evento);
      }
      // También al remitente
      client.emit('new-message', evento);
    }
  }

  @SubscribeMessage('mark-read')
  async onMarkRead(@ConnectedSocket() client: Socket, @MessageBody() payload: { mensajeIds: number[] }) {
    if (!payload.mensajeIds?.length) return;
    await this.mensajeRepo
      .createQueryBuilder()
      .update()
      .set({ leido: true })
      .whereInIds(payload.mensajeIds)
      .execute();
  }

  // Llamado desde SuperAdminSesionesService
  async kickUser(idOdoo: number): Promise<void> {
    const socketId = this.userSocket.get(idOdoo);
    if (socketId) {
      this.server.to(socketId).emit('force-disconnect', { razon: 'Sesión cerrada por el administrador' });
      this.server.in(socketId).disconnectSockets(true);
    }
    await this.sesionRepo.update({ id_odoo: idOdoo }, { activa: false, socket_id: null });
    this.userSocket.delete(idOdoo);
    const entries = [...this.socketUser.entries()].filter(([, v]) => v === idOdoo);
    for (const [k] of entries) this.socketUser.delete(k);
    this.server.emit('sessions-updated');
  }

  private detectDevice(ua: string): string {
    if (/mobile/i.test(ua)) return 'mobile';
    if (/tablet|ipad/i.test(ua)) return 'tablet';
    return 'desktop';
  }
}
