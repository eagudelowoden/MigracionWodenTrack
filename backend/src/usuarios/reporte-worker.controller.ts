import { BadRequestException, Controller, Get, Param, Patch } from '@nestjs/common';
import { ReporteWorkerService } from './reporte-worker.service';

/**
 * Monitoreo de los workers de reporte (Super Admin): quiénes están corriendo
 * ahora mismo, con qué filtros, cuánto llevan y su último progreso. Permite
 * matar un worker colgado manualmente.
 */
@Controller('usuarios/reporte-workers')
export class ReporteWorkerController {
  constructor(private readonly workers: ReporteWorkerService) {}

  @Get()
  listar() {
    return {
      activos: this.workers.listarActivos(),
      pool: this.workers.estadoPool(),
    };
  }

  @Patch(':pid/matar')
  matar(@Param('pid') pid: string) {
    const ok = this.workers.matar(Number(pid));
    if (!ok) throw new BadRequestException('No se encontró un worker activo con ese PID.');
    return { ok: true };
  }
}
