import { Injectable, BadRequestException } from '@nestjs/common';
import { UsuariosService } from '../usuarios/usuarios.service';

// Máximo de días por consulta a Odoo (mismo límite que usa
// UsuariosService.getReporteNovedades para proteger memoria/tiempo de respuesta).
const MAX_DIAS_POR_CONSULTA = 32;

interface FilaReporte {
  empleado: string;
  cc: string;
  department_id: string;
  c_entrada: string;
  fecha: string;
}

@Injectable()
export class DashboardAsistenciaService {
  constructor(private readonly usuariosService: UsuariosService) {}

  private validarRango(startDate?: string, endDate?: string) {
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate y endDate son requeridos (formato YYYY-MM-DD)');
    }
    const dias = Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000);
    if (dias < 0) throw new BadRequestException('startDate debe ser anterior a endDate');
    if (dias > MAX_DIAS_POR_CONSULTA) {
      throw new BadRequestException(
        `El rango máximo permitido es ${MAX_DIAS_POR_CONSULTA} días. Seleccionaste ${dias} días.`,
      );
    }
  }

  /** Parte [startDate, endDate] en tramos de calendario mensual (cada uno < 32 días),
   *  necesario porque el motor de Odoo (getReporteNovedades) rechaza rangos más largos. */
  private partirEnMeses(startDate: string, endDate: string): { start: string; end: string }[] {
    const tramos: { start: string; end: string }[] = [];
    let [y, m] = startDate.split('-').map(Number);
    const fin = new Date(endDate + 'T00:00:00');

    while (true) {
      const inicioMes = new Date(y, m - 1, 1);
      const finMes = new Date(y, m, 0); // último día del mes
      const tramoInicio = inicioMes < new Date(startDate + 'T00:00:00') ? startDate : inicioMes.toISOString().slice(0, 10);
      const tramoFin = finMes > fin ? endDate : finMes.toISOString().slice(0, 10);
      tramos.push({ start: tramoInicio, end: tramoFin });

      if (finMes >= fin) break;
      m += 1;
      if (m > 12) { m = 1; y += 1; }
    }
    return tramos;
  }

  private async obtenerFilas(
    startDate: string,
    endDate: string,
    departamento?: string,
    company?: string,
  ): Promise<FilaReporte[]> {
    const filas = await this.usuariosService.getReporteNovedades(
      false,
      company,
      startDate,
      endDate,
      departamento,
      undefined,
      undefined,
      true,
      undefined,
      undefined,
    );
    // Filas sin malla asignada ese día no cuentan ni como puntuales ni como
    // tardías (no hay contra qué comparar la hora de entrada).
    return (filas as FilaReporte[]).filter(f => f.c_entrada && f.c_entrada !== 'No programado');
  }

  async rankingTardanzas(
    startDate: string,
    endDate: string,
    departamento?: string,
    company?: string,
  ) {
    this.validarRango(startDate, endDate);
    const filas = await this.obtenerFilas(startDate, endDate, departamento, company);

    const porEmpleado = new Map<string, { cedula: string; nombre: string; departamento: string; total_tardanzas: number }>();
    for (const f of filas) {
      if (f.c_entrada !== 'ENTRADA TARDE') continue;
      const key = f.cc || f.empleado;
      const actual = porEmpleado.get(key) || { cedula: f.cc, nombre: f.empleado, departamento: f.department_id, total_tardanzas: 0 };
      actual.total_tardanzas += 1;
      porEmpleado.set(key, actual);
    }

    const ranking = [...porEmpleado.values()].sort((a, b) => b.total_tardanzas - a.total_tardanzas);

    return { startDate, endDate, departamento: departamento ?? null, ranking };
  }

  async cumplimientoPorArea(startDate: string, endDate: string, company?: string) {
    this.validarRango(startDate, endDate);
    const filas = await this.obtenerFilas(startDate, endDate, undefined, company);

    const porArea = new Map<string, { total_registros: number; total_tardanzas: number }>();
    for (const f of filas) {
      const dept = f.department_id || 'SIN DEPTO';
      const actual = porArea.get(dept) || { total_registros: 0, total_tardanzas: 0 };
      actual.total_registros += 1;
      if (f.c_entrada === 'ENTRADA TARDE') actual.total_tardanzas += 1;
      porArea.set(dept, actual);
    }

    const areas = [...porArea.entries()]
      .map(([departamento, { total_registros, total_tardanzas }]) => ({
        departamento,
        total_registros,
        total_tardanzas,
        porcentaje_cumplimiento: total_registros > 0
          ? Math.round((100 - (total_tardanzas / total_registros) * 100) * 100) / 100
          : 100,
      }))
      .sort((a, b) => b.porcentaje_cumplimiento - a.porcentaje_cumplimiento);

    return { startDate, endDate, areas };
  }

  async tendenciaMensual(
    startDate: string,
    endDate: string,
    departamento?: string,
    company?: string,
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate y endDate son requeridos (formato YYYY-MM-DD)');
    }
    if (new Date(startDate) > new Date(endDate)) {
      throw new BadRequestException('startDate debe ser anterior a endDate');
    }

    const tramos = this.partirEnMeses(startDate, endDate);
    const serie: { mes: string; total_registros: number; total_tardanzas: number; porcentaje_cumplimiento: number }[] = [];

    // Secuencial (no en paralelo): cada tramo ya es una consulta pesada a Odoo
    // (proceso forked, control de admisión anti-OOM); lanzarlas todas a la vez
    // multiplicaría la carga justo lo que ese control intenta evitar.
    for (const tramo of tramos) {
      const filas = await this.obtenerFilas(tramo.start, tramo.end, departamento, company);
      const total = filas.length;
      const tardanzas = filas.filter(f => f.c_entrada === 'ENTRADA TARDE').length;
      serie.push({
        mes: tramo.start.slice(0, 7),
        total_registros: total,
        total_tardanzas: tardanzas,
        porcentaje_cumplimiento: total > 0 ? Math.round((100 - (tardanzas / total) * 100) * 100) / 100 : 100,
      });
    }

    return { serie };
  }

  async departamentos(company?: string): Promise<{ departamentos: string[] }> {
    const departamentos = await this.usuariosService.getDepartamentosMalla(company);
    return { departamentos };
  }
}
