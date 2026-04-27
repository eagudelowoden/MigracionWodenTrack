import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MallasCrudService } from './mallas-crud.service';

@Controller('usuarios/mallas-admin')
export class MallasCrudController {
  constructor(private readonly mallasCrudService: MallasCrudService) {}

  @Get()
  listar() {
    return this.mallasCrudService.listar();
  }

  @Post()
  crear(@Body() body: any) {
    return this.mallasCrudService.crear(body);
  }

  @Delete(':id')
  eliminar(@Param('id') id: string) {
    return this.mallasCrudService.eliminar(Number(id));
  }

  @Patch(':id/toggle')
  toggle(@Param('id') id: string, @Body() body: { activa: boolean }) {
    return this.mallasCrudService.toggleActiva(Number(id), body.activa);
  }

  @Patch(':id/detalles')
  actualizarDetalles(@Param('id') id: string, @Body() body: { detalles: any[] }) {
    return this.mallasCrudService.actualizarDetalles(Number(id), body.detalles ?? []);
  }

  @Post('upload-excel')
  @UseInterceptors(FileInterceptor('file'))
  async uploadExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se recibió archivo');
    return this.mallasCrudService.procesarExcelCreacion(file.buffer);
  }

  @Get('plantilla')
  async descargarPlantilla(@Res() res: any) {
    const workbook = this.mallasCrudService.generarPlantillaExcel();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=plantilla-mallas.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  }
}
