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
        ciphers: 'SSLv3', // 👈 necesario para Office 365
        rejectUnauthorized: false, // 👈 evita errores de certificado
      },
    });
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
      to: process.env.MAIL_ALERT_TO, // destinatario
      subject: `${icono} ${titulo} - Sistema Asistencias`,
      html,
    });
  }
}
