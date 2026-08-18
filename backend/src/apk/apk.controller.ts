import { Controller, Get, Post, Delete, Body, UseInterceptors, UploadedFile, StreamableFile, Header } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { createReadStream } from 'fs';
import { join } from 'path';
import { ApkService } from './apk.service';
import { Public } from '../auth/public.decorator';

@Controller('apk')
export class ApkController {
  constructor(private readonly apkService: ApkService) { }

  @Public()
  @Get('info')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  getInfo() {
    return this.apkService.getApkInfo();
  }

  // Historial de versiones subidas — útil para auditar qué se publicó y cuándo.
  @Get('history')
  getHistory() {
    return this.apkService.getHistory();
  }

  @Public()
  @Get('download')
  @Header('Content-Type', 'application/vnd.android.package-archive')
  @Header('Content-Disposition', 'attachment; filename="WodenTrack.apk"')
  download() {
    const filePath = this.apkService.getFilePath();
    const file = createReadStream(filePath);
    return new StreamableFile(file);
  }

  // ENDPOINT PARA GUARDAR NOVEDADES
  @Post('changelog')
  updateChangelog(@Body() data: { notes: string[] }) {
    return this.apkService.updateChangelog(data.notes);
  }

  // ENDPOINT PARA SUBIR EL APK (Reemplaza el archivo actual)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/apk',
      filename: (req, file, cb) => {
        cb(null, 'app-debug.apk'); // Siempre se llamará igual para reemplazar
      },
    }),
  }))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const entry = await this.apkService.registerUpload();
    return { status: 'success', message: 'Archivo APK reemplazado correctamente', ...entry };
  }

  // ENDPOINT PARA ELIMINAR EL APK PUBLICADO
  @Delete()
  deleteApk() {
    return this.apkService.deleteApk();
  }
}