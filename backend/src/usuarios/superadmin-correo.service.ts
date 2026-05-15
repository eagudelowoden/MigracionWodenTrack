import { Injectable } from '@nestjs/common';
import { SistemaConfigService } from '../sistema-config/sistema-config.service';
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
  constructor(private readonly cfg: SistemaConfigService) {}

  // ── Configuración ────────────────────────────────────────────
  async getConfig() {
    const all = await this.cfg.getAll();
    return {
      host: all[K.HOST] || '',
      port: all[K.PORT] || '587',
      user: all[K.USER] || '',
      passConfigurado: !!all[K.PASS],
      fromNombre: all[K.FROM_NAME] || 'WodenTrack',
      habilitado: all[K.HABILITADO] === 'true',
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

  // ── Transporter dinámico ─────────────────────────────────────
  private async crearTransporter() {
    const all = await this.cfg.getAll();
    return nodemailer.createTransport({
      host: all[K.HOST],
      port: Number(all[K.PORT]) || 587,
      secure: false,
      auth: { user: all[K.USER], pass: all[K.PASS] },
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
    const habilitado = await this.cfg.get(K.HABILITADO, 'false');
    if (habilitado !== 'true') {
      return { ok: false, mensaje: 'El sistema de correo está deshabilitado' };
    }

    try {
      const t = await this.crearTransporter();
      const all = await this.cfg.getAll();
      const fromNombre = all[K.FROM_NAME] || 'WodenTrack';
      const fromUser = all[K.USER];

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

  // ── Recordatorio automático ───────────────────────────────────
  async enviarRecordatorio(
    titulo: string,
    mensaje: string,
    destinatarios: string[],
  ): Promise<void> {
    const cfg = await this.getConfig();
    if (!cfg.habilitado) return;
    const t = await this.crearTransporter();
    const from = `"${cfg.fromNombre || 'WodenTrack'}" <${cfg.user}>`;
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
