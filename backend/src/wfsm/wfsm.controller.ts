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
      const { registros, modo, total_api, sugerencia, dias_rango, dias_con_cache, truncado } = await this.svc.getSerialesRecuperados(
        fecha,
        fechaFin,
        body.documento,
        body.agente,
      );

      return {
        ok: true,
        fecha,
        fecha_fin: fechaFin,
        // modo realmente usado: 'directo' (API de WFS) o 'bd' (caché).
        // Con WFSM_CONSULTA_DIRECTA=auto lo decide la presencia de cédula.
        modo,
        // Cuántos registros devolvió WFS antes de filtrar en memoria. Si viene
        // igual al total con y sin documento, WFS está ignorando el filtro.
        total_api,
        total: registros.length,
        // Cobertura de la caché en el rango pedido. Si dias_con_cache es menor
        // que dias_rango, hay días que el cron aún no ha traído: un resultado
        // corto puede deberse a eso y no a que no existan registros.
        dias_rango,
        dias_con_cache,
        // true = habia mas resultados de los que se devuelven (tope de filas).
        truncado,
        // Mensaje de ayuda cuando no hubo resultados y no se filtró por cédula.
        sugerencia,
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
