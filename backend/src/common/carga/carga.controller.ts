import { Controller, Get } from '@nestjs/common';
import { CargaService } from './carga.service';
import { Public } from '../../auth/public.decorator';

/**
 * Diagnóstico en vivo del control de admisión: cuántas consultas pesadas hay
 * en curso, cuántas esperando en cola y la presión de memoria actual.
 * Útil para monitoreo (curl / uptime checks / dashboard).
 */
@Controller('usuarios/carga')
export class CargaController {
  constructor(private readonly carga: CargaService) {}

  @Public()
  @Get('estado')
  estado() {
    return this.carga.estado();
  }
}
