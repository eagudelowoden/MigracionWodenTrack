import { Controller, Get, Post, Body, UseInterceptors, UploadedFile, StreamableFile, Header } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { createReadStream } from 'fs';
import { join } from 'path';
import { ApkService } from './apk.service';

@Controller('apk')
export class ApkController {
  constructor(private readonly apkService: ApkService) { }

  @Get('info')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  getInfo() {
    return this.apkService.getApkInfo();
  }

  @Get('download')
  @Header('Content-Type', 'application/vnd.android.package-archive')
  @Header('Content-Disposition', 'attachment; filename="app-debug.apk"')
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
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return { status: 'success', message: 'Archivo APK reemplazado correctamente' };
  }
}