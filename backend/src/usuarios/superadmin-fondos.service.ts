import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { FondoEmpleado } from './entities/fondo-empleado.entity';
import { FondoEmpleadoCorreo } from './entities/fondo-empleado-correo.entity';
import { SistemaConfigService } from '../sistema-config/sistema-config.service';
import * as nodemailer from 'nodemailer';

const MAIL_KEYS = {
  HOST:      'correo_smtp_host',
  PORT:      'correo_smtp_port',
  USER:      'correo_smtp_user',
  PASS:      'correo_smtp_pass',
  FROM_NAME: 'correo_from_nombre',
  HABILITADO:'correo_habilitado',
};

@Injectable()
export class SuperAdminFondosService {
  constructor(
    @InjectRepository(FondoEmpleado)
    private readonly fondoRepo: Repository<FondoEmpleado>,
    @InjectRepository(FondoEmpleadoCorreo)
    private readonly correoRepo: Repository<FondoEmpleadoCorreo>,
    private readonly cfg: SistemaConfigService,
    private readonly env: ConfigService,
  ) {}

  private envFallback(dbVal: string | undefined, envKey: string, def = ''): string {
    return dbVal || this.env.get<string>(envKey, def);
  }

  private async crearTransporter() {
    const all = await this.cfg.getAll();
    return nodemailer.createTransport({
      host: this.envFallback(all[MAIL_KEYS.HOST], 'MAIL_HOST', 'smtp.office365.com'),
      port: Number(this.envFallback(all[MAIL_KEYS.PORT], 'MAIL_PORT', '587')),
      secure: false,
      requireTLS: true,
      auth: {
        user: this.envFallback(all[MAIL_KEYS.USER], 'MAIL_USER', ''),
        pass: this.envFallback(all[MAIL_KEYS.PASS], 'MAIL_PASS', ''),
      },
      tls: { rejectUnauthorized: false },
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  private mapFondo(f: FondoEmpleado) {
    return {
      id: f.id,
      nombre: f.nombre,
      creado_por: f.creado_por,
      created_at: f.created_at,
      updated_at: f.updated_at,
      correos: (f.correos_rel ?? []).map((c) => c.email),
    };
  }

  // ── GET all ───────────────────────────────────────────────────────────────
  async findAll() {
    const rows = await this.fondoRepo.find({ order: { nombre: 'ASC' } });
    return rows.map(this.mapFondo);
  }

  // ── POST create ───────────────────────────────────────────────────────────
  async create(nombre: string, createdBy: string) {
    const fondo = this.fondoRepo.create({ nombre: nombre.trim(), creado_por: createdBy });
    const saved = await this.fondoRepo.save(fondo);
    return this.mapFondo(saved);
  }

  // ── PATCH update ──────────────────────────────────────────────────────────
  async update(
    id: number,
    data: { nombre?: string; correos?: string[]; updatedBy?: string },
  ) {
    const fondo = await this.fondoRepo.findOne({ where: { id } });
    if (!fondo) throw new NotFoundException(`Fondo ${id} no encontrado`);

    if (data.nombre) {
      fondo.nombre = data.nombre.trim();
      await this.fondoRepo.save(fondo);
    }

    if (Array.isArray(data.correos)) {
      // Reemplazar todos los correos del fondo
      await this.correoRepo.delete({ fondo_id: id });
      if (data.correos.length > 0) {
        const entities = data.correos.map((email) =>
          this.correoRepo.create({ fondo_id: id, email: email.toLowerCase().trim() }),
        );
        await this.correoRepo.save(entities);
      }
    }

    const updated = await this.fondoRepo.findOne({ where: { id } });
    return this.mapFondo(updated!);
  }

  // ── DELETE ────────────────────────────────────────────────────────────────
  async remove(id: number) {
    const fondo = await this.fondoRepo.findOne({ where: { id } });
    if (!fondo) throw new NotFoundException(`Fondo ${id} no encontrado`);
    // correos se eliminan en cascada (onDelete: CASCADE)
    await this.fondoRepo.remove(fondo);
    return { ok: true };
  }

  // ── GET correos de un fondo (util para notificaciones) ────────────────────
  async getCorreosByFondo(id: number): Promise<string[]> {
    const rows = await this.correoRepo.find({ where: { fondo_id: id } });
    return rows.map((r) => r.email);
  }

  // ── Notificar a un fondo sobre la renuncia de un empleado ──────────────────
  async notificarFondo(
    id: number,
    data: {
      empleado: string;
      cedula?: string;
      departamento?: string;
      fechaRenuncia?: string;
      enviadoPor?: string;
    },
  ): Promise<{ ok: boolean; mensaje: string }> {
    const fondo = await this.fondoRepo.findOne({ where: { id } });
    if (!fondo) throw new NotFoundException(`Fondo ${id} no encontrado`);

    const correos = await this.getCorreosByFondo(id);
    if (!correos.length) {
      return { ok: false, mensaje: 'El fondo no tiene correos configurados' };
    }

    const all = await this.cfg.getAll();
    const habilitado =
      all[MAIL_KEYS.HABILITADO] === 'true' || !!this.env.get('MAIL_USER');
    if (!habilitado) {
      return { ok: false, mensaje: 'El sistema de correo está deshabilitado' };
    }

    try {
      const t     = await this.crearTransporter();
      const fromUser   = this.envFallback(all[MAIL_KEYS.USER],      'MAIL_USER', '');
      const fromNombre = this.envFallback(all[MAIL_KEYS.FROM_NAME], 'MAIL_USER', 'WodenTrack');

      const fecha = data.fechaRenuncia
        ? new Date(data.fechaRenuncia).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
        : '—';

      const html = `
        <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
          <div style="background:#7c3aed;padding:24px 28px">
            <h1 style="margin:0;color:#fff;font-size:18px;font-weight:700">Notificación de Renuncia</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:12px">Fondo: ${fondo.nombre}</p>
          </div>
          <div style="padding:24px 28px">
            <p style="margin:0 0 16px;font-size:13px;color:#475569">
              Se informa al fondo <strong>${fondo.nombre}</strong> sobre la renuncia del siguiente colaborador:
            </p>
            <table style="width:100%;border-collapse:collapse;font-size:12px">
              <tr style="background:#f8fafc">
                <td style="padding:8px 12px;font-weight:600;color:#64748b;width:40%">Colaborador</td>
                <td style="padding:8px 12px;color:#1e293b;font-weight:600">${data.empleado ?? '—'}</td>
              </tr>
              <tr>
                <td style="padding:8px 12px;font-weight:600;color:#64748b;border-top:1px solid #f1f5f9">Cédula</td>
                <td style="padding:8px 12px;color:#1e293b;border-top:1px solid #f1f5f9">${data.cedula ?? '—'}</td>
              </tr>
              <tr style="background:#f8fafc">
                <td style="padding:8px 12px;font-weight:600;color:#64748b;border-top:1px solid #f1f5f9">Departamento</td>
                <td style="padding:8px 12px;color:#1e293b;border-top:1px solid #f1f5f9">${data.departamento ?? '—'}</td>
              </tr>
              <tr>
                <td style="padding:8px 12px;font-weight:600;color:#64748b;border-top:1px solid #f1f5f9">Fecha de renuncia</td>
                <td style="padding:8px 12px;color:#1e293b;border-top:1px solid #f1f5f9">${fecha}</td>
              </tr>
            </table>
            <p style="margin:20px 0 0;font-size:11px;color:#94a3b8">
              Notificado por: ${data.enviadoPor ?? 'Capital Humano'} · ${new Date().toLocaleDateString('es-CO')}
            </p>
          </div>
        </div>`;

      await t.sendMail({
        from: `"${fromNombre}" <${fromUser}>`,
        to: correos.join(', '),
        subject: `Renuncia — ${data.empleado} · Fondo ${fondo.nombre}`,
        html,
      });

      return {
        ok: true,
        mensaje: `Correo enviado a ${correos.length} destinatario(s) del fondo ${fondo.nombre}`,
      };
    } catch (e) {
      return { ok: false, mensaje: `Error al enviar: ${e.message}` };
    }
  }
}
