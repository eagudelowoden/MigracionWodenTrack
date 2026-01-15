// contracts-upload.controller.ts
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SubirContratosService } from './subir-contratos.service';

@Controller('usuarios/contracts-upload')
export class SubirContratosController {
  constructor(private readonly uploadService: SubirContratosService) { }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importContracts(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se ha recibido ningún archivo Excel.');
    }

    // CORRECCIÓN: Realizamos un cast explícito a Buffer de Node.js
    // Esto resuelve la incompatibilidad de firmas de [Symbol.toStringTag]
    return await this.uploadService.processExcel(file.buffer as Buffer);
  }
}