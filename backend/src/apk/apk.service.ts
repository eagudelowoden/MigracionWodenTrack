import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import * as fs from 'fs';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ApkParser = require('app-info-parser/src/apk');

@Injectable()
export class ApkService {
  private readonly folderPath = join(process.cwd(), 'uploads', 'apk');
  private readonly fileName = 'app-debug.apk';
  private readonly apkPath = join(this.folderPath, this.fileName);
  private readonly jsonPath = join(this.folderPath, 'changelog.json');

  // Caché en memoria del versionName leído del .apk, para no descomprimirlo
  // en cada request a /apk/info (se llama seguido, cada vez que la app vuelve
  // a primer plano). Se invalida sola comparando mtime del archivo.
  private versionCache: { mtimeMs: number; version: string } | null = null;

  constructor(private configService: ConfigService) {}

  /**
   * La versión "disponible" ya NO se lee de una variable .env — eso obligaba
   * a reiniciar el servidor cada vez que se subía una APK nueva, y era fácil
   * que quedara desincronizada del archivo real (justo la causa de los bugs
   * de banner-que-no-se-va que estuvimos persiguiendo). Ahora se extrae
   * directo del versionName empaquetado DENTRO del .apk que está en el
   * servidor — siempre exacto, sin pasos manuales.
   */
  private async getInstalledApkVersion(): Promise<string> {
    const stats = fs.statSync(this.apkPath);
    if (this.versionCache && this.versionCache.mtimeMs === stats.mtimeMs) {
      return this.versionCache.version;
    }
    try {
      const parser = new ApkParser(this.apkPath);
      const result = await parser.parse();
      const version = result.versionName || this.configService.get<string>('APP_VERSION_APK') || '1.0.0';
      this.versionCache = { mtimeMs: stats.mtimeMs, version };
      return version;
    } catch (e) {
      console.error('Error al leer versionName del APK:', e.message);
      return this.configService.get<string>('APP_VERSION_APK') || '1.0.0';
    }
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

  updateChangelog(notes: string[]) {
    if (!fs.existsSync(this.folderPath)) fs.mkdirSync(this.folderPath, { recursive: true });
    fs.writeFileSync(this.jsonPath, JSON.stringify(notes, null, 2));
    return { status: 'success', message: 'Novedades actualizadas' };
  }
}