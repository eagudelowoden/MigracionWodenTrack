import { SetMetadata } from '@nestjs/common';

/** Clave de metadata que marca un handler como "consulta pesada". */
export const ES_PESADO = 'es_pesado';

/**
 * Marca un endpoint como consulta pesada. El `CargaPesadaInterceptor` aplicará
 * control de admisión (memoria + concurrencia) solo a los handlers marcados.
 *
 * Uso:  @Pesado()  @Get('reporte-novedades')  reporte() { ... }
 */
export const Pesado = () => SetMetadata(ES_PESADO, true);
