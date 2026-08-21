import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as nodemailer from 'nodemailer';
import { cargarEnvDelAmbiente, loadEntities, guardarReporteEsquema } from './shared/deploy-env';

/**
 * Verifica ANTES de un despliegue que la base de datos real tenga todas las
 * tablas/columnas que el código espera (según los decoradores @Entity/@Column
 * ya compilados en dist/). No altera nada — solo lee INFORMATION_SCHEMA.
 *
 * Uso: node dist/scripts/verify-schema.js   (con NODE_ENV ya seteado)
 * Sale con código 0 si todo está OK, o 1 si falta algo (para poder encadenar
 * con && en el script de despliegue y frenar antes de reiniciar PM2).
 */

const NODE_ENV = process.env.NODE_ENV || 'development';
cargarEnvDelAmbiente(NODE_ENV);

// Cuenta INDEPENDIENTE de MAIL_USER/MAIL_PASS (la que usa mail.service.ts para
// alertas del sistema): así, si una cuenta se queda sin acceso (contraseña
// vencida, bloqueo de Microsoft 365, etc.), no se cae la otra. DEPLOY_MAIL_USER
// cae a MAIL_USER solo si no está configurada (compatibilidad hacia atrás).
async function alertar(problemas: string[]) {
  const mailUser = process.env.DEPLOY_MAIL_USER || process.env.MAIL_USER;
  const mailPass = process.env.DEPLOY_MAIL_PASS || process.env.MAIL_PASS;
  if (!mailUser || !mailPass || !process.env.MAIL_ALERT_TO) {
    console.log('📧 DEPLOY_MAIL_USER/DEPLOY_MAIL_PASS/MAIL_ALERT_TO no configurados — omitiendo alerta por correo.');
    return;
  }
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.DEPLOY_MAIL_HOST || process.env.MAIL_HOST || 'smtp.office365.com',
      port: Number(process.env.DEPLOY_MAIL_PORT || process.env.MAIL_PORT) || 587,
      secure: false,
      requireTLS: true,
      auth: { user: mailUser, pass: mailPass },
      tls: { rejectUnauthorized: false },
    });
    const lista = problemas.map((p) => `<li>${p}</li>`).join('');
    await transporter.sendMail({
      from: `"Despliegue WodenTrack" <${mailUser}>`,
      to: process.env.MAIL_ALERT_TO,
      subject: `🚫 Despliegue detenido (${NODE_ENV}) — esquema de base de datos incompleto`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;">
          <h2 style="color:#E24B4A;">🚫 Despliegue detenido — esquema incompleto (${NODE_ENV})</h2>
          <p>El script de verificación previa al despliegue encontró que faltan elementos en la base de datos:</p>
          <ul>${lista}</ul>
          <p style="color:#888;font-size:12px;">Aplica los ALTER TABLE necesarios en la base correcta y vuelve a desplegar.</p>
        </div>
      `,
    });
    console.log(`📧 Alerta de despliegue detenido enviada a ${process.env.MAIL_ALERT_TO}`);
  } catch (e: any) {
    console.error(`📧 No se pudo enviar la alerta por correo: ${e.message}`);
  }
}

async function main() {
  console.log(`🔍 Verificando esquema de base de datos (NODE_ENV=${NODE_ENV})`);
  console.log(`🔌 Objetivo: ${process.env.DB_HOST}:${process.env.DB_PORT || 1433} / base: ${process.env.DB_NAME}`);

  const entities = loadEntities(__dirname);
  console.log(`   ${entities.length} entidades encontradas en dist/.`);

  const ds = new DataSource({
    type: 'mssql',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 1433),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    entities,
    synchronize: false,
    logging: false,
    options: { encrypt: false, trustServerCertificate: true, connectTimeout: 30000 },
  });

  try {
    await ds.initialize();
  } catch (e: any) {
    const msg = `No se pudo conectar a la base de datos (${process.env.DB_HOST}/${process.env.DB_NAME}): ${e.message}`;
    console.error(`❌ ${msg}`);
    await alertar([msg]);
    process.exit(1);
  }

  const problemas: string[] = [];
  const tablasVerificadas: string[] = [];

  for (const meta of ds.entityMetadatas) {
    const tabla = meta.tableName;
    tablasVerificadas.push(tabla);

    const existeTabla = await ds.query(
      `SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = @0`,
      [tabla],
    );
    if (Number(existeTabla[0].c) === 0) {
      problemas.push(`Tabla faltante: "${tabla}" (entidad ${meta.name})`);
      continue;
    }

    const columnasDb: string[] = (
      await ds.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = @0`,
        [tabla],
      )
    ).map((r: any) => r.COLUMN_NAME);

    for (const col of meta.columns) {
      if (!columnasDb.includes(col.databaseName)) {
        problemas.push(`Columna faltante: "${tabla}"."${col.databaseName}" (entidad ${meta.name})`);
      }
    }
  }

  await ds.destroy();

  if (problemas.length > 0) {
    console.error(`❌ Verificación de esquema FALLIDA — ${problemas.length} problema(s):`);
    problemas.forEach((p) => console.error(`   - ${p}`));
    await alertar(problemas);
    process.exit(1);
  }

  // Deja constancia de qué tablas se revisaron para que notify-deploy.ts
  // pueda mostrarlas en el correo de éxito sin volver a conectarse a la BD.
  guardarReporteEsquema(tablasVerificadas, NODE_ENV);

  console.log('✅ Esquema OK — todas las tablas y columnas esperadas existen. Se puede continuar el despliegue.');
  process.exit(0);
}

main().catch((e) => {
  console.error('❌ Error inesperado verificando esquema:', e);
  process.exit(1);
});
