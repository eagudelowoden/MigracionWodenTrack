import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { RecordatorioMalla } from './entities/recordatorio.entity';
import { InternoGateway } from '../usuarios/interno.gateway';
import { SuperAdminCorreoService } from '../usuarios/superadmin-correo.service';

export class RecordatorioDto {
  nombre: string;
  mensaje: string;
  dias: number[];       // [0..6]
  hora: string;         // "HH:mm"
  canal: string;        // 'websocket'|'email'|'ambos'
  destinatarios: { id_odoo: number; nombre: string }[];
  activo: boolean;
}

@Injectable()
export class RecordatoriosService {
  private readonly logger = new Logger(RecordatoriosService.name);

  constructor(
    @InjectRepository(RecordatorioMalla)
    private readonly repo: Repository<RecordatorioMalla>,
    private readonly gateway: InternoGateway,
    private readonly correo: SuperAdminCorreoService,
  ) {}

  findAll(): Promise<RecordatorioMalla[]> {
    return this.repo.find({ order: { id: 'ASC' } });
  }

  async create(dto: RecordatorioDto): Promise<RecordatorioMalla> {
    const rec = this.repo.create({
      nombre:       dto.nombre,
      mensaje:      dto.mensaje,
      dias:         JSON.stringify(dto.dias),
      hora:         dto.hora,
      canal:        dto.canal || 'websocket',
      destinatarios: JSON.stringify(dto.destinatarios || []),
      activo:       dto.activo ?? true,
    });
    return this.repo.save(rec);
  }

  async update(id: number, dto: Partial<RecordatorioDto>): Promise<RecordatorioMalla> {
    const rec = await this.repo.findOneOrFail({ where: { id } });
    if (dto.nombre      !== undefined) rec.nombre      = dto.nombre;
    if (dto.mensaje     !== undefined) rec.mensaje     = dto.mensaje;
    if (dto.dias        !== undefined) rec.dias        = JSON.stringify(dto.dias);
    if (dto.hora        !== undefined) rec.hora        = dto.hora;
    if (dto.canal       !== undefined) rec.canal       = dto.canal;
    if (dto.destinatarios !== undefined) rec.destinatarios = JSON.stringify(dto.destinatarios);
    if (dto.activo      !== undefined) rec.activo      = dto.activo;
    return this.repo.save(rec);
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete(id);
  }

  async toggle(id: number): Promise<RecordatorioMalla> {
    const rec = await this.repo.findOneOrFail({ where: { id } });
    rec.activo = !rec.activo;
    return this.repo.save(rec);
  }

  // ── Cron: cada minuto revisa si hay recordatorios que disparar ───────────
  @Cron('* * * * *')
  async revisarRecordatorios() {
    const ahora    = new Date();
    const diaHoy   = ahora.getDay();                          // 0=Dom…6=Sáb
    const horaAhora = `${String(ahora.getHours()).padStart(2,'0')}:${String(ahora.getMinutes()).padStart(2,'0')}`;

    const activos = await this.repo.find({ where: { activo: true } });

    for (const rec of activos) {
      let dias: number[] = [];
      try { dias = JSON.parse(rec.dias); } catch { continue; }

      if (!dias.includes(diaHoy)) continue;
      if (rec.hora !== horaAhora) continue;

      this.logger.log(`Disparando recordatorio "${rec.nombre}" — ${horaAhora}`);
      await this.disparar(rec);
    }
  }

  async disparar(rec: RecordatorioMalla): Promise<void> {
    let destinatarios: { id_odoo: number; nombre: string }[] = [];
    try { destinatarios = JSON.parse(rec.destinatarios || '[]'); } catch {}

    const evento = {
      id:          0,
      de_id_odoo:  0,
      de_nombre:   '🔔 Sistema WodenTrack',
      para_id_odoo: null,
      contenido:   `[Recordatorio] ${rec.nombre}: ${rec.mensaje}`,
      created_at:  new Date().toISOString(),
      tipo:        'recordatorio',
    };

    if (rec.canal === 'websocket' || rec.canal === 'ambos') {
      // Emite evento 'reminder' dedicado (diferente al chat)
      this.gateway.server?.emit('reminder', {
        titulo:  rec.nombre,
        mensaje: rec.mensaje,
        hora:    new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' }),
      });
    }

    if (rec.canal === 'email' || rec.canal === 'ambos') {
      const emails = destinatarios.map(d => d.nombre); // fallback: nombres
      try {
        await this.correo.enviarRecordatorio(rec.nombre, rec.mensaje, emails);
      } catch (e) {
        this.logger.warn(`Email de recordatorio falló: ${e.message}`);
      }
    }
  }

  // Disparo manual desde el controller
  async dispararManual(id: number): Promise<{ ok: boolean }> {
    const rec = await this.repo.findOneOrFail({ where: { id } });
    await this.disparar(rec);
    return { ok: true };
  }
}
