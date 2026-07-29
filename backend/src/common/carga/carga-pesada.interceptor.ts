import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { CargaService } from './carga.service';
import { ES_PESADO } from './pesado.decorator';

/**
 * Aplica control de admisión SOLO a los endpoints marcados con @Pesado().
 * Si el sistema está bajo presión (memoria o concurrencia), rechaza la petición
 * con 503 + un cuerpo que el frontend reconoce para mostrar "vuelve a intentar".
 * Los endpoints no marcados (login, marcación, etc.) pasan sin restricción.
 */
@Injectable()
export class CargaPesadaInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly carga: CargaService,
  ) {}

  async intercept(
    ctx: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const esPesado = this.reflector.getAllAndOverride<boolean>(ES_PESADO, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!esPesado) return next.handle();

    // Espera en cola hasta 30 s si no hay cupo; rechaza si la memoria ya está
    // peligrosa o si se agota la espera.
    const motivo = await this.carga.adquirir();
    if (motivo) {
      throw new HttpException(
        {
          code: 'SISTEMA_OCUPADO',
          motivo, // 'memoria' | 'ocupado'
          message:
            'Ups, esto podría tardar un poco. Intenta de nuevo en unos segundos.',
        },
        HttpStatus.SERVICE_UNAVAILABLE, // 503
      );
    }

    // Cupo reservado → liberar SIEMPRE al terminar (éxito o error).
    return next.handle().pipe(finalize(() => this.carga.liberar()));
  }
}
