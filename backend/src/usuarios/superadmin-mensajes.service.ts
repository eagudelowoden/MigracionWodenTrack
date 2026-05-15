import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MensajeInterno } from './entities/mensaje-interno.entity';
import { SistemaConfigService } from '../sistema-config/sistema-config.service';

const KEY_DESTINATARIOS = 'mensajes_destinatarios';

export class DestinatarioItem {
  id_odoo: number;
  nombre: string;
  cargo?: string;
}

@Injectable()
export class SuperAdminMensajesService {
  constructor(
    @InjectRepository(MensajeInterno)
    private readonly mensajeRepo: Repository<MensajeInterno>,
    private readonly config: SistemaConfigService,
  ) {}

  // ── Destinatarios ────────────────────────────────────────────
  async getDestinatarios(): Promise<DestinatarioItem[]> {
    const raw = await this.config.get(KEY_DESTINATARIOS);
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
  }

  async addDestinatario(item: DestinatarioItem): Promise<DestinatarioItem[]> {
    const lista = await this.getDestinatarios();
    if (lista.some(d => d.id_odoo === item.id_odoo)) return lista;
    lista.push(item);
    await this.config.set(KEY_DESTINATARIOS, JSON.stringify(lista));
    return lista;
  }

  async removeDestinatario(idOdoo: number): Promise<DestinatarioItem[]> {
    const lista = (await this.getDestinatarios()).filter(d => d.id_odoo !== idOdoo);
    await this.config.set(KEY_DESTINATARIOS, JSON.stringify(lista));
    return lista;
  }

  // ── Historial ────────────────────────────────────────────────
  getHistorial(deIdOdoo: number | null, paraIdOdoo: number | null, limit = 50): Promise<MensajeInterno[]> {
    const qb = this.mensajeRepo.createQueryBuilder('m').orderBy('m.created_at', 'DESC').limit(limit);

    if (deIdOdoo !== null && paraIdOdoo !== null) {
      qb.where(
        '(m.de_id_odoo = :a AND m.para_id_odoo = :b) OR (m.de_id_odoo = :b AND m.para_id_odoo = :a)',
        { a: deIdOdoo, b: paraIdOdoo },
      );
    } else {
      // Historial general (superadmin)
      qb.where('1=1');
    }

    return qb.getMany().then(rows => rows.reverse());
  }

  async marcarLeidos(mensajeIds: number[]): Promise<void> {
    if (!mensajeIds.length) return;
    await this.mensajeRepo.createQueryBuilder().update().set({ leido: true }).whereInIds(mensajeIds).execute();
  }

  getNoLeidos(paraIdOdoo: number): Promise<number> {
    return this.mensajeRepo.count({ where: { para_id_odoo: paraIdOdoo, leido: false } });
  }
}
