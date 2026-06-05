import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false,
      },
    });
  }

  async enviarAprobacionHorasExtra(datos: {
    registro: {
      cedula: string;
      nombre: string;
      fecha: string;
      cargo?: string | null;
      departamento?: string | null;
      company?: string | null;
      rn: number;
      rndf: number;
      rddf: number;
      hedo: number;
      heno: number;
      hefd: number;
      hefn: number;
      observacion?: string | null;
    };
    excelBuffer: Buffer;
  }) {
    if (!process.env.MAIL_ALERT_TO) {
      console.log('📧 MAIL_ALERT_TO no configurado — omitiendo envío');
      return;
    }

    try {
      const { registro, excelBuffer } = datos;
      const fecha = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });

      const filaHoras = (label: string, val: number) =>
        val > 0
          ? `<tr><td style="padding:4px 8px;color:#888;">${label}</td><td style="padding:4px 8px;font-weight:bold;">${Math.floor(val)} h</td></tr>`
          : '';

      const html = `
        <div style="font-family:Arial,sans-serif;max-width:540px;margin:0 auto;">
          <div style="border-left:4px solid #16a34a;padding:16px 20px;background:#f9fafb;border-radius:8px;">
            <h2 style="margin:0 0 12px;font-size:16px;color:#1a1a1a;">✅ Horas extra aprobadas</h2>
            <table style="width:100%;font-size:13px;color:#444;border-collapse:collapse;">
              <tr><td style="padding:4px 8px;color:#888;">Colaborador</td><td style="padding:4px 8px;font-weight:bold;">${registro.nombre}</td></tr>
              <tr><td style="padding:4px 8px;color:#888;">Cédula</td><td style="padding:4px 8px;">${registro.cedula}</td></tr>
              <tr><td style="padding:4px 8px;color:#888;">Fecha</td><td style="padding:4px 8px;">${registro.fecha}</td></tr>
              ${registro.cargo ? `<tr><td style="padding:4px 8px;color:#888;">Cargo</td><td style="padding:4px 8px;">${registro.cargo}</td></tr>` : ''}
              ${registro.departamento ? `<tr><td style="padding:4px 8px;color:#888;">Departamento</td><td style="padding:4px 8px;">${registro.departamento}</td></tr>` : ''}
              ${registro.company ? `<tr><td style="padding:4px 8px;color:#888;">Empresa</td><td style="padding:4px 8px;">${registro.company}</td></tr>` : ''}
              ${filaHoras('RN', registro.rn)}
              ${filaHoras('RNDF', registro.rndf)}
              ${filaHoras('RDDF', registro.rddf)}
              ${filaHoras('HEDO', registro.hedo)}
              ${filaHoras('HENO', registro.heno)}
              ${filaHoras('HEFD', registro.hefd)}
              ${filaHoras('HEFN', registro.hefn)}
              ${registro.observacion ? `<tr><td style="padding:8px 8px 4px;color:#888;vertical-align:top;">Observación</td><td style="padding:8px 8px 4px;font-style:italic;">${registro.observacion}</td></tr>` : ''}
            </table>
            <p style="margin:12px 0 0;font-size:11px;color:#aaa;">${fecha} · Sistema de Asistencias</p>
          </div>
        </div>
      `;

      await this.transporter.sendMail({
        from: `"Sistema Asistencias" <${process.env.MAIL_USER}>`,
        to: process.env.MAIL_ALERT_TO,
        subject: `✅ Horas extra aprobadas — ${registro.nombre} (${registro.fecha})`,
        html,
        attachments: [
          {
            filename: `horas_extra_${registro.cedula}_${registro.fecha}.xlsx`,
            content: excelBuffer,
            contentType:
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          },
        ],
      });

      console.log(`📧 Aprobación HX enviada → ${process.env.MAIL_ALERT_TO}`);
    } catch (error) {
      console.error('📧 Error enviando correo de aprobación HX:', error.message);
    }
  }

  async enviarNovedadesAprobadas(datos: {
    registros: any[];
    excelBuffer: Buffer;
    destinatarios?: string[];
  }) {
    // Usar SOLO los destinatarios configurados en la BD.
    // El fallback MAIL_ALERT_TO ya no aplica — si no hay destinatarios configurados
    // simplemente no se envía, para evitar notificar a correos no deseados.
    const to = datos.destinatarios?.length
      ? datos.destinatarios.join(', ')
      : null;
    if (!to) return;
    try {
      const { registros, excelBuffer } = datos;
      const fecha = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });
      const filas = registros
        .map(
          (r) =>
            `<tr>
              <td style="padding:4px 8px;border-bottom:1px solid #f0f0f0;">${r.cedula}</td>
              <td style="padding:4px 8px;border-bottom:1px solid #f0f0f0;font-weight:600;">${r.nombre}</td>
              <td style="padding:4px 8px;border-bottom:1px solid #f0f0f0;">${r.fecha}</td>
              <td style="padding:4px 8px;border-bottom:1px solid #f0f0f0;">${r.departamento || '—'}</td>
              <td style="padding:4px 8px;border-bottom:1px solid #f0f0f0;font-style:italic;">${r.observacion || '—'}</td>
            </tr>`,
        )
        .join('');

      const html = `
        <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;">
          <div style="border-left:4px solid #16a34a;padding:16px 20px;background:#f9fafb;border-radius:8px;">
            <h2 style="margin:0 0 12px;font-size:16px;color:#1a1a1a;">✅ Novedades de horas extra aprobadas</h2>
            <p style="font-size:12px;color:#666;margin:0 0 12px;">${registros.length} registro(s) aprobado(s). Ver detalle en el archivo adjunto.</p>
            <table style="width:100%;font-size:12px;color:#444;border-collapse:collapse;">
              <thead>
                <tr style="background:#f0f0f0;">
                  <th style="padding:6px 8px;text-align:left;">Cédula</th>
                  <th style="padding:6px 8px;text-align:left;">Nombre</th>
                  <th style="padding:6px 8px;text-align:left;">Fecha</th>
                  <th style="padding:6px 8px;text-align:left;">Departamento</th>
                  <th style="padding:6px 8px;text-align:left;">Observación</th>
                </tr>
              </thead>
              <tbody>${filas}</tbody>
            </table>
            <p style="margin:12px 0 0;font-size:11px;color:#aaa;">${fecha} · Sistema de Asistencias</p>
          </div>
        </div>
      `;

      const fechaArchivo = new Date().toISOString().slice(0, 10);
      await this.transporter.sendMail({
        from: `"Sistema Asistencias" <${process.env.MAIL_USER}>`,
        to,
        subject: `✅ Novedades HX aprobadas (${registros.length} registros) — ${fechaArchivo}`,
        html,
        attachments: [
          {
            filename: `novedades_hx_aprobadas_${fechaArchivo}.xlsx`,
            content: excelBuffer,
            contentType:
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          },
        ],
      });
      console.log(`📧 Novedades HX enviadas → ${process.env.MAIL_ALERT_TO}`);
    } catch (error) {
      console.error('📧 Error enviando novedades HX:', error.message);
    }
  }

  async enviarAlertaConsulta(datos: {
    tipo: 'grande' | 'error' | 'completada';
    registros?: number;
    tiempo?: number;
    departamento?: string;
    rango?: string;
    mensaje?: string;
  }) {
    if (process.env.MAIL_ALERTS_ENABLED !== 'true') {
      console.log('📧 Alertas de correo desactivadas — omitiendo envío');
      return;
    }

    try {
      const { tipo, registros, tiempo, departamento, rango, mensaje } = datos;

      const colores = {
        grande: {
          borde: '#BA7517',
          titulo: 'Consulta grande detectada',
          icono: '⚠️',
        },
        error: { borde: '#E24B4A', titulo: 'Error en consulta', icono: '❌' },
        completada: {
          borde: '#639922',
          titulo: 'Consulta completada',
          icono: '✅',
        },
      };

      const { borde, titulo, icono } = colores[tipo];

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <div style="border-left: 4px solid ${borde}; padding: 16px 20px; background: #f9f9f9; border-radius: 8px;">
            <h2 style="margin: 0 0 8px; font-size: 16px; color: #1a1a1a;">${icono} ${titulo}</h2>

            <table style="width: 100%; font-size: 13px; color: #444; border-collapse: collapse;">
              ${
                departamento
                  ? `
              <tr>
                <td style="padding: 4px 0; color: #888;">Departamento</td>
                <td style="padding: 4px 0; font-weight: bold;">${departamento}</td>
              </tr>`
                  : ''
              }

              ${
                rango
                  ? `
              <tr>
                <td style="padding: 4px 0; color: #888;">Rango de fechas</td>
                <td style="padding: 4px 0; font-weight: bold;">${rango}</td>
              </tr>`
                  : ''
              }

              ${
                registros !== undefined
                  ? `
              <tr>
                <td style="padding: 4px 0; color: #888;">Registros</td>
                <td style="padding: 4px 0; font-weight: bold;">${registros.toLocaleString()}</td>
              </tr>`
                  : ''
              }

              ${
                tiempo !== undefined
                  ? `
              <tr>
                <td style="padding: 4px 0; color: #888;">Tiempo</td>
                <td style="padding: 4px 0; font-weight: bold;">${tiempo.toFixed(1)}s</td>
              </tr>`
                  : ''
              }

              ${
                mensaje
                  ? `
              <tr>
                <td colspan="2" style="padding: 8px 0 0; color: #666; font-style: italic;">${mensaje}</td>
              </tr>`
                  : ''
              }
            </table>

            <p style="margin: 12px 0 0; font-size: 11px; color: #aaa;">
              ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })} · Sistema de Asistencias
            </p>
          </div>
        </div>
      `;

      await this.transporter.sendMail({
        from: `"Sistema Asistencias" <${process.env.MAIL_USER}>`,
        to: process.env.MAIL_ALERT_TO,
        subject: `${icono} ${titulo} - Sistema Asistencias`,
        html,
      });

      console.log(
        `📧 Alerta enviada: [${tipo}] → ${process.env.MAIL_ALERT_TO}`,
      );
    } catch (error) {
      console.error('📧 Error enviando alerta de correo:', error.message);
    }
  }
}
