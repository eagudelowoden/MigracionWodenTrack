import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { WfsmService } from './wfsm.service';

@Controller('usuarios/wfsm')
export class WfsmController {
  constructor(private readonly svc: WfsmService) {}

  @Post('seriales-recuperados')
  async getSerialesRecuperados(
    @Body()
    body: {
      fecha?: string;
      fecha_fin?: string;
      documento?: string;
      agente?: string;
    },
  ) {
    const fecha = body.fecha ?? new Date().toISOString().split('T')[0];
    // Sin fecha_fin la consulta es de un solo día (comportamiento anterior).
    const fechaFin = body.fecha_fin ?? fecha;

    try {
      const { registros, modo, total_api } = await this.svc.getSerialesRecuperados(
        fecha,
        fechaFin,
        body.documento,
        body.agente,
      );

      return {
        ok: true,
        fecha,
        fecha_fin: fechaFin,
        // modo: 'directo' (API de WFS) o 'bd' (caché). Lo define
        // WFSM_CONSULTA_DIRECTA en el entorno.
        modo,
        // Cuántos registros devolvió WFS antes de filtrar en memoria. Si viene
        // igual al total con y sin documento, WFS está ignorando el filtro.
        total_api,
        total: registros.length,
        registros,
      };
    } catch (err) {
      throw new HttpException(
        { ok: false, error: err instanceof Error ? err.message : 'Error al consultar WFS' },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
