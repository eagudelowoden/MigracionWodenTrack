import * as fs from 'fs';
import * as path from 'path';
import * as nodemailer from 'nodemailer';

/**
 * Envia un correo confirmando que el despliegue terminó bien — se corre como
 * ÚLTIMO paso del pipeline, después de reiniciar PM2. Si esto se ejecuta, ya
 * pasaron el gate de pruebas, el build y la verificación de esquema.
 *
 * Uso: node dist/scripts/notify-deploy.js   (con NODE_ENV ya seteado)
 */

const NODE_ENV = process.env.NODE_ENV || 'development';

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return false;
  const content = fs.readFileSync(filePath, 'utf-8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
  return true;
}

const envEspecifico = path.resolve(process.cwd(), `.env.${NODE_ENV}`);
if (!loadEnvFile(envEspecifico)) {
  loadEnvFile(path.resolve(process.cwd(), '.env'));
}

async function main() {
  if (!process.env.MAIL_USER || !process.env.MAIL_ALERT_TO) {
    console.log('📧 MAIL_USER/MAIL_ALERT_TO no configurados — omitiendo aviso de despliegue.');
    return;
  }

  const fecha = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.office365.com',
      port: Number(process.env.MAIL_PORT) || 587,
      secure: false,
      requireTLS: true,
      auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
      tls: { rejectUnauthorized: false },
    });

    await transporter.sendMail({
      from: `"Despliegue WodenTrack" <${process.env.MAIL_USER}>`,
      to: process.env.MAIL_ALERT_TO,
      subject: `✅ Despliegue exitoso (${NODE_ENV})`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;">
          <h2 style="color:#16a34a;">✅ Despliegue exitoso — ${NODE_ENV}</h2>
          <p>El pipeline terminó completo: pruebas, build, copia de archivos,
          verificación de esquema de base de datos y reinicio del proceso —
          todo pasó sin errores.</p>
          <p style="color:#888;font-size:12px;">${fecha}</p>
        </div>
      `,
    });
    console.log(`📧 Aviso de despliegue exitoso enviado a ${process.env.MAIL_ALERT_TO}`);
  } catch (e: any) {
    // Nunca tumbar el despliegue por un fallo de correo — el deploy ya sucedió.
    console.error(`📧 No se pudo enviar el aviso de despliegue (no crítico): ${e.message}`);
  }
}

main();
