import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import * as fs from 'fs';

@Injectable()
export class ApkService {
  private readonly folderPath = join(process.cwd(), 'uploads', 'apk');
  private readonly fileName = 'app-debug.apk';
  private readonly apkPath = join(this.folderPath, this.fileName);
  private readonly jsonPath = join(this.folderPath, 'changelog.json');

  constructor(private configService: ConfigService) {}

  getApkInfo() {
    const fileExists = fs.existsSync(this.apkPath);
    
    // EXPLICACIÓN: En lugar de import.meta.env, usamos configService.
    // Esto buscará VITE_API_URL en tu archivo .env del backend.
    const baseUrl = this.configService.get<string>('VITE_API_URL') || 
                    this.configService.get<string>('API_EXTERNAL_URL') || 
                    'http://localhost:8082';

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
        version: "N/A",
        size: "0",
        lastUpdate: null,
        downloadUrl: null,
        changelog: ["El repositorio se está actualizando. Vuelve más tarde."]
      };
    }

    const stats = fs.statSync(this.apkPath);

    return {
      exists: true,
      version: this.configService.get<string>('APP_VERSION') || '1.0.0',
      size: (stats.size / (1024 * 1024)).toFixed(2),
      lastUpdate: stats.mtime,
      downloadUrl: `${baseUrl}/apk/download`, // Aquí se usa tu variable del .env
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