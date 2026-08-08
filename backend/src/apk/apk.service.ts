import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import * as fs from 'fs';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ApkParser = require('app-info-parser/src/apk');

export interface ApkVersionEntry {
  version: string;
  versionCode: number;
  uploadedAt: string;
}

interface ApkMeta {
  current: ApkVersionEntry | null;
  history: ApkVersionEntry[];
}

@Injectable()
export class ApkService {
  private readonly folderPath = join(process.cwd(), 'uploads', 'apk');
  private readonly fileName = 'app-debug.apk';
  private readonly apkPath = join(this.folderPath, this.fileName);
  private readonly jsonPath = join(this.folderPath, 'changelog.json');
  // Metadata persistida (versión actual + historial) — se escribe UNA vez al
  // subir el archivo, no se vuelve a parsear el .apk en cada consulta.
  private readonly metaPath = join(this.folderPath, 'apk-meta.json');
  private readonly MAX_HISTORY = 20;

  constructor(private configService: ConfigService) {}

  private readMeta(): ApkMeta {
    if (!fs.existsSync(this.metaPath)) return { current: null, history: [] };
    try {
      return JSON.parse(fs.readFileSync(this.metaPath, 'utf8'));
    } catch {
      return { current: null, history: [] };
    }
  }

  private writeMeta(meta: ApkMeta) {
    fs.writeFileSync(this.metaPath, JSON.stringify(meta, null, 2));
  }

  /**
   * Lee versionName/versionCode DENTRO del .apk que se acaba de subir y los
   * guarda en apk-meta.json — la versión "actual" pasa a historial. Antes la
   * versión "disponible" se leía de una variable .env, lo que obligaba a
   * reiniciar el servidor cada vez que se subía una APK y era fácil que
   * quedara desincronizada del archivo real (la causa de los bugs de
   * banner-que-no-se-va que estuvimos persiguiendo). Ahora es automático:
   * subir el archivo YA deja todo listo, sin pasos manuales.
   */
  async registerUpload(): Promise<ApkVersionEntry> {
    const parser = new ApkParser(this.apkPath);
    const result = await parser.parse();
    const entry: ApkVersionEntry = {
      version: result.versionName || this.configService.get<string>('APP_VERSION_APK') || '1.0.0',
      versionCode: result.versionCode ?? 0,
      uploadedAt: new Date().toISOString(),
    };

    const meta = this.readMeta();
    if (meta.current) meta.history.unshift(meta.current);
    meta.current = entry;
    meta.history = meta.history.slice(0, this.MAX_HISTORY);
    this.writeMeta(meta);

    return entry;
  }

  /**
   * Respaldo para un .apk que ya estaba en el servidor ANTES de que
   * existiera apk-meta.json (por ejemplo, subido a mano por SCP) — lo parsea
   * una sola vez y se "autocura" guardando el meta para las próximas veces.
   */
  private async getInstalledApkVersion(): Promise<string> {
    const meta = this.readMeta();
    if (meta.current) return meta.current.version;

    try {
      const entry = await this.registerUpload();
      return entry.version;
    } catch (e) {
      console.error('Error al leer versionName del APK:', e.message);
      return this.configService.get<string>('APP_VERSION_APK') || '1.0.0';
    }
  }

  getHistory(): ApkVersionEntry[] {
    const meta = this.readMeta();
    return meta.current ? [meta.current, ...meta.history] : meta.history;
  }

  async getApkInfo() {
    const fileExists = fs.existsSync(this.apkPath);

    // EXPLICACIÓN: En lugar de import.meta.env, usamos configService.
    // Esto buscará VITE_API_URL en tu archivo .env del backend.
    const baseUrl = this.configService.get<string>('APP_BASE_URL') ||
                    'http://localhost:8082';
    // Página pública de descarga (frontend), NO el endpoint crudo del archivo —
    // así el navegador/WebView nunca navega a una URL con IP:puerto expuesta.
    const frontendUrl = this.configService.get<string>('APP_FRONTEND_URL') || baseUrl;

    let changelog = ["Preparando nueva versión..."];
    if (fs.existsSync(this.jsonPath)) {
      try {
        changelog = JSON.parse(fs.readFileSync(this.jsonPath, 'utf8'));
      } catch (e) {
        console.error("Error al parsear changelog.json");
      }
    }

    if (!fileExists) {
      return {
        exists: false,
        version: this.configService.get<string>('APP_VERSION_APK') || '1.0.0', // versión real aunque no haya archivo
        size: "0",
        lastUpdate: null,
        downloadUrl: null,
        downloadPageUrl: `${frontendUrl}/download`,
        changelog: ["El repositorio se está actualizando. Vuelve más tarde."]
      };
    }

    const stats = fs.statSync(this.apkPath);
    const version = await this.getInstalledApkVersion();

    return {
      exists: true,
      version,
      size: (stats.size / (1024 * 1024)).toFixed(2),
      lastUpdate: stats.mtime,
      downloadUrl: `${baseUrl}/apk/download`, // Aquí se usa tu variable del .env
      downloadPageUrl: `${frontendUrl}/download`, // Página que abre la app móvil — nunca la URL cruda del archivo
      changelog
    };
  }

  getFilePath() {
    if (!fs.existsSync(this.apkPath)) throw new NotFoundException('Archivo físico no encontrado');
    return this.apkPath;
  }

  // Elimina el .apk publicado. El historial de versiones anteriores se
  // conserva (es un registro/auditoría, no depende del archivo físico).
  deleteApk() {
    if (fs.existsSync(this.apkPath)) fs.unlinkSync(this.apkPath);

    const meta = this.readMeta();
    meta.current = null;
    this.writeMeta(meta);

    return { status: 'success', message: 'APK eliminada' };
  }

  updateChangelog(notes: string[]) {
    if (!fs.existsSync(this.folderPath)) fs.mkdirSync(this.folderPath, { recursive: true });
    fs.writeFileSync(this.jsonPath, JSON.stringify(notes, null, 2));
    return { status: 'success', message: 'Novedades actualizadas' };
  }
}