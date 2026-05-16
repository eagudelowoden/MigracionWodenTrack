import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { SistemaConfigService } from '../sistema-config/sistema-config.service';
import { CorreoDestinatario } from './entities/correo-destinatario.entity';
import * as nodemailer from 'nodemailer';

const K = {
  HOST: 'correo_smtp_host',
  PORT: 'correo_smtp_port',
  USER: 'correo_smtp_user',
  PASS: 'correo_smtp_pass',
  FROM_NAME: 'correo_from_nombre',
  HABILITADO: 'correo_habilitado',
};

@Injectable()
export class SuperAdminCorreoService {
  constructor(
    private readonly cfg: SistemaConfigService,
    private readonly env: ConfigService,
    @InjectRepository(CorreoDestinatario)
    private readonly destRepo: Repository<CorreoDestinatario>,
  ) {}

  // ── Fallback a .env si la BD no tiene valores ─────────────────
  private envFallback(dbVal: string | undefined, envKey: string, def = ''): string {
    return dbVal || this.env.get<string>(envKey, def);
  }

  // ── Configuración ────────────────────────────────────────────
  async getConfig() {
    const all = await this.cfg.getAll();
    return {
      host:            this.envFallback(all[K.HOST],      'MAIL_HOST', 'smtp.office365.com'),
      port:            this.envFallback(all[K.PORT],      'MAIL_PORT', '587'),
      user:            this.envFallback(all[K.USER],      'MAIL_USER', ''),
      passConfigurado: !!(all[K.PASS] || this.env.get('MAIL_PASS')),
      fromNombre:      this.envFallback(all[K.FROM_NAME], 'MAIL_USER', 'WodenTrack'),
      habilitado:      all[K.HABILITADO] === 'true' || !!this.env.get('MAIL_USER'),
    };
  }

  async saveConfig(
    data: {
      host: string;
      port: string;
      user: string;
      pass?: string;
      fromNombre: string;
      habilitado: boolean;
    },
    updatedBy: string,
  ) {
    const updates: Record<string, string> = {
      [K.HOST]: data.host,
      [K.PORT]: data.port,
      [K.USER]: data.user,
      [K.FROM_NAME]: data.fromNombre,
      [K.HABILITADO]: data.habilitado ? 'true' : 'false',
    };
    // Solo actualiza contraseña si se envió un valor nuevo
    if (data.pass && data.pass.trim()) {
      updates[K.PASS] = data.pass.trim();
    }
    await this.cfg.setBulk(updates, updatedBy);
    return { ok: true };
  }

  // ── Transporter dinámico (BD > .env como fallback) ───────────
  private async crearTransporter() {
    const all = await this.cfg.getAll();
    const host = this.envFallback(all[K.HOST], 'MAIL_HOST', 'smtp.office365.com');
    const port = Number(this.envFallback(all[K.PORT], 'MAIL_PORT', '587'));
    const user = this.envFallback(all[K.USER], 'MAIL_USER', '');
    const pass = this.envFallback(all[K.PASS], 'MAIL_PASS', '');
    const requireTls = true;

    return nodemailer.createTransport({
      host,
      port,
      secure: false,
      requireTLS: requireTls,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
    });
  }

  async testConexion(): Promise<{ ok: boolean; mensaje: string }> {
    try {
      const t = await this.crearTransporter();
      await t.verify();
      return { ok: true, mensaje: 'Conexión SMTP exitosa ✓' };
    } catch (e) {
      return { ok: false, mensaje: `Error: ${e.message}` };
    }
  }

  // ── Envío manual de ausentismo ───────────────────────────────
  private async correoHabilitado(): Promise<boolean> {
    const dbVal = await this.cfg.get(K.HABILITADO, 'false');
    return dbVal === 'true' || !!this.env.get('MAIL_USER');
  }

  async enviarAusentismo(data: {
    empleado: string;
    cedula?: string;
    cargo?: string;
    departamento?: string;
    area?: string;
    fechaInicio: string;
    fechaFin?: string;
    motivo?: string;
    destinatarios: string[];
    enviadoPor: string;
  }): Promise<{ ok: boolean; mensaje: string }> {
    if (!(await this.correoHabilitado())) {
      return { ok: false, mensaje: 'El sistema de correo está deshabilitado' };
    }

    try {
      const t = await this.crearTransporter();
      const all = await this.cfg.getAll();
      const fromUser = this.envFallback(all[K.USER], 'MAIL_USER', '');
      const fromNombre = this.envFallback(all[K.FROM_NAME], 'MAIL_USER', 'WodenTrack');

      const fechaDisplay =
        data.fechaFin && data.fechaFin !== data.fechaInicio
          ? `${data.fechaInicio} al ${data.fechaFin}`
          : data.fechaInicio;

      await t.sendMail({
        from: `"${fromNombre}" <${fromUser}>`,
        to: data.destinatarios.join(', '),
        subject: `Ausentismo — ${data.empleado} · ${fechaDisplay}`,
        html: this.buildHtml(data),
      });

      return {
        ok: true,
        mensaje: `Correo enviado a: ${data.destinatarios.join(', ')}`,
      };
    } catch (e) {
      return { ok: false, mensaje: `Error al enviar: ${e.message}` };
    }
  }

  // ── Destinatarios de novedades (tabla correo_destinatarios) ──
  async getDestinatariosNovedades(): Promise<string[]> {
    const rows = await this.destRepo.find({ where: { tipo: 'novedades' } });
    return rows.map(r => r.email);
  }

  async saveDestinatariosNovedades(destinatarios: string[], updatedBy: string): Promise<{ ok: boolean }> {
    // Borra todos los actuales del tipo 'novedades' y reinserta
    await this.destRepo.delete({ tipo: 'novedades' });
    if (destinatarios.length > 0) {
      const entities = destinatarios.map(email =>
        this.destRepo.create({ tipo: 'novedades', email: email.toLowerCase().trim(), creado_por: updatedBy }),
      );
      await this.destRepo.save(entities);
    }
    return { ok: true };
  }

  // ── Envío de aprobación de novedad ───────────────────────────
  async enviarAprobacionNovedad(data: {
    empleado: string;
    cedula?: string;
    tipificacion?: string;
    descripcion?: string;
    fechaInicio?: string;
    fechaFin?: string;
    cargo?: string;
    departamento?: string;
    aprobadoPor: string;
    decision: 'aprobado' | 'rechazado';
    motivo?: string;
    rol: 'jefe' | 'rrhh';
    attachment?: { filename: string; content: Buffer; contentType: string };
  }): Promise<{ ok: boolean; mensaje: string }> {
    if (!(await this.correoHabilitado())) return { ok: false, mensaje: 'Sistema de correo deshabilitado' };

    const destinatarios = await this.getDestinatariosNovedades();
    if (!destinatarios.length) return { ok: false, mensaje: 'No hay destinatarios configurados para novedades' };

    try {
      const t = await this.crearTransporter();
      const all = await this.cfg.getAll();
      const fromUser = this.envFallback(all[K.USER], 'MAIL_USER', '');
      const fromNombre = this.envFallback(all[K.FROM_NAME], 'MAIL_USER', 'WodenTrack');
      const esAprobado = data.decision === 'aprobado';

      await t.sendMail({
        from: `"${fromNombre}" <${fromUser}>`,
        to: destinatarios.join(', '),
        subject: `Novedad ${esAprobado ? 'Aprobada ✓' : 'Rechazada ✗'} — ${data.empleado}`,
        html: this.buildNovedadHtml(data),
        attachments: data.attachment
          ? [{ filename: data.attachment.filename, content: data.attachment.content, contentType: data.attachment.contentType }]
          : [],
      });

      return { ok: true, mensaje: `Correo enviado a: ${destinatarios.join(', ')}` };
    } catch (e) {
      return { ok: false, mensaje: `Error al enviar: ${e.message}` };
    }
  }

  private buildNovedadHtml(data: {
    empleado: string;
    cedula?: string;
    tipificacion?: string;
    descripcion?: string;
    fechaInicio?: string;
    fechaFin?: string;
    cargo?: string;
    departamento?: string;
    aprobadoPor: string;
    decision: 'aprobado' | 'rechazado';
    motivo?: string;
    rol: 'jefe' | 'rrhh';
  }): string {
    const esAprobado = data.decision === 'aprobado';
    const color = esAprobado ? '#10b981' : '#ef4444';
    const icon = esAprobado ? '✓' : '✗';
    const rolLabel = data.rol === 'jefe' ? 'Coordinador / Jefe' : 'Capital Humano';

    const rows: [string, string][] = [
      ['Empleado', data.empleado],
      ...(data.cedula ? [['Cédula', data.cedula] as [string, string]] : []),
      ...(data.cargo ? [['Cargo', data.cargo] as [string, string]] : []),
      ...(data.departamento ? [['Departamento', data.departamento] as [string, string]] : []),
      ...(data.tipificacion ? [['Tipo de novedad', data.tipificacion] as [string, string]] : []),
      ...(data.fechaInicio ? [['Fecha inicio', data.fechaInicio] as [string, string]] : []),
      ...(data.fechaFin ? [['Fecha fin', data.fechaFin] as [string, string]] : []),
      ...(data.descripcion ? [['Descripción', data.descripcion] as [string, string]] : []),
      ['Decisión', `${icon} ${data.decision.toUpperCase()} por ${rolLabel}`],
      ['Aprobado por', data.aprobadoPor],
      ...(data.motivo ? [['Motivo / Observación', data.motivo] as [string, string]] : []),
    ];

    const rowsHtml = rows.map(([label, value]) => `
      <tr>
        <td style="padding:9px 14px;color:#64748b;font-size:12px;width:140px;border-bottom:1px solid #f1f5f9;white-space:nowrap;">${label}</td>
        <td style="padding:9px 14px;color:#1e293b;font-size:12px;font-weight:600;border-bottom:1px solid #f1f5f9;">${value}</td>
      </tr>`).join('');

    return `
      <div style="font-family:Inter,Arial,sans-serif;max-width:540px;margin:0 auto;background:#f8fafc;padding:28px 16px;">
        <div style="background:white;border-radius:14px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <div style="background:linear-gradient(135deg,#1e3a5f 0%,#1f2937 100%);padding:22px 28px;">
            <p style="margin:0;color:rgba(255,255,255,0.5);font-size:9px;font-weight:800;letter-spacing:3px;text-transform:uppercase;">WodenTrack · Novedades</p>
            <h1 style="margin:6px 0 0;color:#ffffff;font-size:20px;font-weight:800;">
              <span style="color:${color};">${icon}</span> Novedad ${esAprobado ? 'Aprobada' : 'Rechazada'}
            </h1>
          </div>
          <table style="width:100%;border-collapse:collapse;">${rowsHtml}</table>
          <div style="padding:14px 28px;background:#f8fafc;border-top:1px solid #f1f5f9;">
            <p style="margin:0;font-size:10px;color:#94a3b8;">
              ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })} · Sistema WodenTrack
            </p>
          </div>
        </div>
      </div>`;
  }

  // ── Recordatorio automático ───────────────────────────────────
  async enviarRecordatorio(
    titulo: string,
    mensaje: string,
    destinatarios: string[],
  ): Promise<void> {
    if (!(await this.correoHabilitado())) return;
    const t = await this.crearTransporter();
    const all = await this.cfg.getAll();
    const fromNombre = this.envFallback(all[K.FROM_NAME], 'MAIL_USER', 'WodenTrack');
    const fromUser = this.envFallback(all[K.USER], 'MAIL_USER', '');
    const from = `"${fromNombre}" <${fromUser}>`;
    const html = `
      <div style="font-family:Inter,sans-serif;max-width:500px;margin:0 auto;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:linear-gradient(135deg,#1e3a5f 0%,#1f2937 100%);padding:22px 28px;">
          <p style="margin:0;color:rgba(255,255,255,0.55);font-size:9px;font-weight:800;letter-spacing:3px;text-transform:uppercase;">WodenTrack · Recordatorio</p>
          <h1 style="margin:6px 0 0;color:#ffffff;font-size:18px;font-weight:800;">🔔 ${titulo}</h1>
        </div>
        <div style="padding:24px 28px;">
          <p style="font-size:14px;color:#334155;line-height:1.6;">${mensaje}</p>
        </div>
        <div style="padding:14px 28px;background:#f8fafc;border-top:1px solid #f1f5f9;">
          <p style="margin:0;font-size:10px;color:#94a3b8;">
            ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })} · Sistema WodenTrack
          </p>
        </div>
      </div>`;
    await t.sendMail({
      from,
      to: destinatarios.join(', ') || from,
      subject: `🔔 Recordatorio: ${titulo}`,
      html,
    });
  }

  // ── Template HTML ─────────────────────────────────────────────
  private buildHtml(data: any): string {
    const rows: [string, string][] = [
      ['Empleado', data.empleado],
      ...(data.cedula ? [['Cédula', data.cedula] as [string, string]] : []),
      ...(data.cargo ? [['Cargo', data.cargo] as [string, string]] : []),
      ...(data.departamento
        ? [['Departamento', data.departamento] as [string, string]]
        : []),
      ...(data.area ? [['Área', data.area] as [string, string]] : []),
      ['Fecha inicio', data.fechaInicio],
      ...(data.fechaFin && data.fechaFin !== data.fechaInicio
        ? [['Fecha fin', data.fechaFin] as [string, string]]
        : []),
      ...(data.motivo ? [['Motivo', data.motivo] as [string, string]] : []),
      ['Reportado por', data.enviadoPor],
    ];

    const rowsHtml = rows
      .map(
        ([label, value]) => `
        <tr>
          <td style="padding:9px 14px;color:#64748b;font-size:12px;width:120px;border-bottom:1px solid #f1f5f9;">${label}</td>
          <td style="padding:9px 14px;color:#1e293b;font-size:12px;font-weight:600;border-bottom:1px solid #f1f5f9;">${value}</td>
        </tr>`,
      )
      .join('');

    return `
      <div style="font-family:Inter,Arial,sans-serif;max-width:540px;margin:0 auto;background:#f8fafc;padding:28px 16px;">
        <div style="background:white;border-radius:14px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <div style="background:linear-gradient(135deg,#1e3a5f 0%,#1f2937 100%);padding:22px 28px;">
            <p style="margin:0;color:rgba(255,255,255,0.55);font-size:9px;font-weight:800;letter-spacing:3px;text-transform:uppercase;">WodenTrack · RRHH</p>
            <h1 style="margin:6px 0 0;color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-0.3px;">Reporte de Ausentismo</h1>
          </div>

          <!-- Datos -->
          <table style="width:100%;border-collapse:collapse;">${rowsHtml}</table>

          <!-- Footer -->
          <div style="padding:14px 28px;background:#f8fafc;border-top:1px solid #f1f5f9;">
            <p style="margin:0;font-size:10px;color:#94a3b8;">
              Generado el ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })} · Sistema WodenTrack
            </p>
          </div>
        </div>
      </div>`;
  }
}
