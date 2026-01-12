import { Controller, Get, StreamableFile, Header } from '@nestjs/common';
import { createReadStream } from 'fs';
import { ApkService } from './apk.service';

@Controller('apk')
export class ApkController {
  constructor(private readonly apkService: ApkService) {}

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
}
