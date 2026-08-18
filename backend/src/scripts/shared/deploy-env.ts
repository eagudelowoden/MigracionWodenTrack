import * as fs from 'fs';
import * as path from 'path';

/**
 * Utilidades compartidas entre los scripts de despliegue (verify-schema,
 * notify-deploy): cargar el .env.${NODE_ENV} correcto y listar las clases
 * @Entity compiladas en dist/, sin depender de bootear todo Nest.
 */

export function loadEnvFile(filePath: string): boolean {
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

/** Misma lógica que ConfigModule.forRoot: .env.${NODE_ENV} y si no existe, .env. */
export function cargarEnvDelAmbiente(nodeEnv: string) {
  const envEspecifico = path.resolve(process.cwd(), `.env.${nodeEnv}`);
  if (!loadEnvFile(envEspecifico)) {
    loadEnvFile(path.resolve(process.cwd(), '.env'));
  }
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

/** @param distScriptsDir __dirname del script que llama (dist/scripts) */
export function loadEntities(distScriptsDir: string): Function[] {
  const distRoot = path.resolve(distScriptsDir, '..'); // dist/
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

export const REPORTE_PATH = path.resolve(__dirname, '..', '.ultimo-deploy-schema.json');

export function guardarReporteEsquema(tablas: string[], nodeEnv: string) {
  fs.writeFileSync(
    REPORTE_PATH,
    JSON.stringify({ tablas: tablas.sort(), nodeEnv, fecha: new Date().toISOString() }, null, 2),
  );
}

export function leerReporteEsquema(): { tablas: string[]; nodeEnv: string; fecha: string } | null {
  try {
    if (!fs.existsSync(REPORTE_PATH)) return null;
    return JSON.parse(fs.readFileSync(REPORTE_PATH, 'utf-8'));
  } catch {
    return null;
  }
}
