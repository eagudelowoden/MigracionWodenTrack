import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MallasUploadService } from './mallas-upload.service';

@Controller('usuarios/mallas-upload')
export class MallasUploadController {
  constructor(private readonly mallasUploadService: MallasUploadService) {}

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importMallas(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { asignado_por?: string },
  ) {
    if (!file) throw new BadRequestException('No se recibió archivo.');
    return await this.mallasUploadService.procesarExcel(file.buffer, body.asignado_por);
  }
}
