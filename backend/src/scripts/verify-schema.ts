import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';
import * as nodemailer from 'nodemailer';

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

// Misma lógica que ConfigModule.forRoot en app.module.ts: .env.${NODE_ENV} y
// si no existe, cae a .env — resuelto relativo al directorio de trabajo,
// igual que hace ConfigModule.
const envEspecifico = path.resolve(process.cwd(), `.env.${NODE_ENV}`);
if (!loadEnvFile(envEspecifico)) {
  loadEnvFile(path.resolve(process.cwd(), '.env'));
}

function collectEntityFiles(dir: string, out: string[] = []): string[] {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) collectEntityFiles(full, out);
    else if (name.endsWith('.entity.js')) out.push(full);
  }
  return out;
}

function loadEntities(): Function[] {
  const distRoot = path.resolve(__dirname, '..'); // dist/ (este script vive en dist/scripts)
  const files = collectEntityFiles(distRoot);
  const entities: Function[] = [];
  for (const file of files) {
    const mod = require(file);
    for (const key of Object.keys(mod)) {
      const val = mod[key];
      if (typeof val === 'function') entities.push(val);
    }
  }
  return entities;
}

async function alertar(problemas: string[]) {
  if (!process.env.MAIL_USER || !process.env.MAIL_ALERT_TO) {
    console.log('📧 MAIL_USER/MAIL_ALERT_TO no configurados — omitiendo alerta por correo.');
    return;
  }
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.office365.com',
      port: Number(process.env.MAIL_PORT) || 587,
      secure: false,
      requireTLS: true,
      auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
      tls: { rejectUnauthorized: false },
    });
    const lista = problemas.map((p) => `<li>${p}</li>`).join('');
    await transporter.sendMail({
      from: `"Despliegue WodenTrack" <${process.env.MAIL_USER}>`,
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

  const entities = loadEntities();
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

  for (const meta of ds.entityMetadatas) {
    const tabla = meta.tableName;

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

  console.log('✅ Esquema OK — todas las tablas y columnas esperadas existen. Se puede continuar el despliegue.');
  process.exit(0);
}

main().catch((e) => {
  console.error('❌ Error inesperado verificando esquema:', e);
  process.exit(1);
});
