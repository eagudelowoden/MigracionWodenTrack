import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import * as fs from 'fs';

@Injectable()
export class ApkService {
  constructor(private configService: ConfigService) {}

  private readonly folderPath = join(process.cwd(), 'uploads', 'apk');
  private readonly fileName = 'app-debug.apk';
  private readonly apkPath = join(this.folderPath, this.fileName);
  private readonly jsonPath = join(this.folderPath, 'changelog.json');

getApkInfo() {
  const fileExists = fs.existsSync(this.apkPath);
  const baseUrl = this.configService.get<string>('API_EXTERNAL_URL') || 'http://localhost:8082';
  
  // Intentar leer novedades siempre (aunque no esté la APK)
  let changelog = ["Preparando nueva versión..."];
  if (fs.existsSync(this.jsonPath)) {
    changelog = JSON.parse(fs.readFileSync(this.jsonPath, 'utf8'));
  }

  if (!fileExists) {
    return {
      exists: false, // Bandera para el frontend
      version: "N/A",
      size: "0",
      lastUpdate: null,
      downloadUrl: null,
      changelog: ["El repositorio se está actualizando. Vuelve más tarde."]
    };
  }

  const stats = fs.statSync(this.apkPath);

  return {
    exists: true, // El archivo sí está
    version: this.configService.get<string>('APP_VERSION') || '1.0.0',
    size: (stats.size / (1024 * 1024)).toFixed(2),
    lastUpdate: stats.mtime,
    downloadUrl: `${baseUrl}/apk/download`,
    changelog
  };
}

  // --- EL MÉTODO QUE FALTABA ---
  getFilePath() {
    if (!fs.existsSync(this.apkPath)) throw new NotFoundException('Archivo físico no encontrado');
    return this.apkPath;
  }

  // Guardar nuevas novedades
  updateChangelog(notes: string[]) {
    if (!fs.existsSync(this.folderPath)) fs.mkdirSync(this.folderPath, { recursive: true });
    fs.writeFileSync(this.jsonPath, JSON.stringify(notes, null, 2));
    return { status: 'success', message: 'Novedades actualizadas' };
  }
}