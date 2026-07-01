import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { WfsmService } from './wfsm.service';

@Controller('usuarios/wfsm')
export class WfsmController {
  constructor(private readonly svc: WfsmService) {}

  @Post('seriales-recuperados')
  async getSerialesRecuperados(
    @Body() body: { fecha?: string; documento?: string; agente?: string },
  ) {
    const fecha =
      body.fecha ?? new Date().toISOString().split('T')[0];

    try {
      const registros = await this.svc.getSerialesRecuperados(
        fecha,
        body.documento,
        body.agente,
      );
      return { ok: true, fecha, total: registros.length, registros };
    } catch (err) {
      throw new HttpException(
        { ok: false, error: err instanceof Error ? err.message : 'Error al consultar WFS' },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
