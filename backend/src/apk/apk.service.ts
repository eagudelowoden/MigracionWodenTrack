import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; 
import { join } from 'path';
import * as fs from 'fs';

@Injectable()
export class ApkService {
  constructor(private configService: ConfigService) {}

  // Usamos el nombre que definiste en el controlador para consistencia
  private readonly fileName = 'app-debug.apk';
  private readonly apkPath = join(process.cwd(), 'uploads', 'apk', this.fileName);

  getApkInfo() {
    if (!fs.existsSync(this.apkPath)) {
      throw new NotFoundException('Archivo APK no encontrado en uploads/apk');
    }

    const stats = fs.statSync(this.apkPath);
    
    // Obtenemos la IP o Dominio del .env para el QR dinámico
    // Si no tienes VITE_API_URL en el back, puedes usar la IP fija
    const baseUrl = this.configService.get<string>('API_EXTERNAL_URL') || 'http://localhost:8082';

    return {
      version: this.configService.get<string>('APP_VERSION') || '1.0.2', 
      size: (stats.size / (1024 * 1024)).toFixed(2),
      lastUpdate: stats.mtime,
      name: this.fileName,
      // URL que usará el código QR para descargar directamente
      downloadUrl: `${baseUrl}/apk/download`,
      // Historial de cambios dinámico para el frontend
      changelog: [
        "🚀 Optimización en el tiempo de respuesta de marcación.",
        "📍 Mejora en la precisión del módulo de ubicación.",
        "🎨 Ajustes de contraste en el modo oscuro corporativo.",
        "🛠️ Corrección de errores en la persistencia de sesión."
      ]
    };
  }

  getFilePath() {
    if (!fs.existsSync(this.apkPath)) {
      throw new NotFoundException('El archivo físico no existe');
    }
    return this.apkPath;
  }
}