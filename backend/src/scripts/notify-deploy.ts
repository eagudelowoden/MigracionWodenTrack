import * as nodemailer from 'nodemailer';
import { cargarEnvDelAmbiente, leerReporteEsquema } from './shared/deploy-env';

/**
 * Envia un correo confirmando que el despliegue terminó bien — se corre como
 * ÚLTIMO paso del pipeline, después de reiniciar PM2. Si esto se ejecuta, ya
 * pasaron el gate de pruebas, el build y la verificación de esquema.
 *
 * Uso: node dist/scripts/notify-deploy.js   (con NODE_ENV ya seteado)
 */

const NODE_ENV = process.env.NODE_ENV || 'development';
cargarEnvDelAmbiente(NODE_ENV);

const NOMBRE_AMBIENTE: Record<string, string> = {
  production: 'Producción',
  qa: 'QA / Test',
  development: 'Desarrollo',
};

function badge(texto: string): string {
  return `<span style="display:inline-block;background:#f0fdf4;color:#166534;border:1px solid #bbf7d0;border-radius:999px;padding:4px 12px;margin:3px 4px 3px 0;font-size:12px;font-family:'SFMono-Regular',Consolas,monospace;">${texto}</span>`;
}

async function main() {
  if (!process.env.MAIL_USER || !process.env.MAIL_ALERT_TO) {
    console.log('📧 MAIL_USER/MAIL_ALERT_TO no configurados — omitiendo aviso de despliegue.');
    return;
  }

  const fecha = new Date().toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    dateStyle: 'full',
    timeStyle: 'short',
  });
  const ambiente = NOMBRE_AMBIENTE[NODE_ENV] || NODE_ENV;

  const reporte = leerReporteEsquema();
  const tablasHtml = reporte?.tablas?.length
    ? reporte.tablas.map(badge).join('')
    : '<span style="color:#888;font-size:13px;">(sin detalle disponible)</span>';

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.office365.com',
      port: Number(process.env.MAIL_PORT) || 587,
      secure: false,
      requireTLS: true,
      auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
      tls: { rejectUnauthorized: false },
    });

    const html = `
      <div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
        <div style="background:linear-gradient(135deg,#16a34a,#15803d);border-radius:12px 12px 0 0;padding:28px 32px;">
          <p style="margin:0;font-size:13px;color:#dcfce7;letter-spacing:.05em;text-transform:uppercase;">WodenTrack · Pipeline de despliegue</p>
          <h1 style="margin:8px 0 0;font-size:22px;color:#ffffff;">✅ Despliegue exitoso — ${ambiente}</h1>
        </div>

        <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:24px 32px;">
          <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 20px;">
            El pipeline terminó completo y sin errores. Se llegó hasta el reinicio del
            proceso porque cada paso anterior pasó su propia validación.
          </p>

          <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280;width:36px;vertical-align:top;">🧪</td>
              <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
                <div style="font-size:13px;font-weight:600;color:#111827;">Pruebas unitarias (Jest)</div>
                <div style="font-size:13px;color:#6b7280;margin-top:2px;">
                  Suite completa de controladores y servicios del backend — todas pasaron antes de compilar.
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280;vertical-align:top;">🗄️</td>
              <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
                <div style="font-size:13px;font-weight:600;color:#111827;">Esquema de base de datos verificado</div>
                <div style="font-size:13px;color:#6b7280;margin:2px 0 8px;">
                  Se confirmó que estas tablas tienen todas las columnas que el código espera:
                </div>
                <div>${tablasHtml}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;font-size:13px;color:#6b7280;vertical-align:top;">🚀</td>
              <td style="padding:10px 0;">
                <div style="font-size:13px;font-weight:600;color:#111827;">Proceso reiniciado</div>
                <div style="font-size:13px;color:#6b7280;margin-top:2px;">
                  PM2 recargó el backend con el código nuevo.
                </div>
              </td>
            </tr>
          </table>

          <p style="margin:0;font-size:11px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:14px;">
            ${fecha} · Ambiente: ${NODE_ENV}
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Despliegue WodenTrack" <${process.env.MAIL_USER}>`,
      to: process.env.MAIL_ALERT_TO,
      subject: `✅ Despliegue exitoso — ${ambiente}`,
      html,
    });
    console.log(`📧 Aviso de despliegue exitoso enviado a ${process.env.MAIL_ALERT_TO}`);
  } catch (e: any) {
    // Nunca tumbar el despliegue por un fallo de correo — el deploy ya sucedió.
    console.error(`📧 No se pudo enviar el aviso de despliegue (no crítico): ${e.message}`);
  }
}

main();
