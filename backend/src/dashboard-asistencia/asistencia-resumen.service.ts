import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsuariosService } from '../usuarios/usuarios.service';
import { Novedad } from '../novedades/entities/novedad.entity';
import {
  AsistenciaDiariaResumen,
  EstadoAsistenciaDiaria,
} from './entities/asistencia-diaria-resumen.entity';

/**
 * Cruza malla programada + asistencia real (Odoo) + novedades aprobadas para
 * UN día, y guarda el resultado en `asistencia_diaria_resumen` (upsert por
 * cedula+fecha+company). Lo invoca el worker (`asistencia-resumen-worker.ts`),
 * NUNCA la API en una petición en vivo — por eso puede permitirse recorrer
 * día por día sin preocuparse por el límite de 32 días de `getReporteNovedades`.
 *
 * No toca `clasificarPorMallaLocal`: el minuto exacto de tardanza se calcula
 * aquí mismo, aparte, comparando `check_in` contra la hora de la malla.
 */
@Injectable()
export class AsistenciaResumenService {
  private readonly logger = new Logger(AsistenciaResumenService.name);

  constructor(
    private readonly usuariosService: UsuariosService,
    @InjectRepository(AsistenciaDiariaResumen)
    private readonly resumenRepo: Repository<AsistenciaDiariaResumen>,
    @InjectRepository(Novedad)
    private readonly novedadRepo: Repository<Novedad>,
  ) {}

  /** Calcula y guarda el resumen para cada día del rango [startDate, endDate]. */
  async calcularYGuardarRango(
    startDate: string,
    endDate: string,
    company?: string,
  ): Promise<number> {
    let totalGuardadas = 0;
    for (const fecha of this.rangoDeDias(startDate, endDate)) {
      totalGuardadas += await this.calcularYGuardarDia(fecha, company);
    }
    return totalGuardadas;
  }

  async calcularYGuardarDia(fecha: string, company?: string): Promise<number> {
    const [roster, filas, novedadesAprobadas] = await Promise.all([
      this.usuariosService.getRosterProgramado(fecha, company),
      this.usuariosService.getReporteNovedades(false, company, fecha, fecha),
      this.novedadRepo.find({ where: { aprobado: 1 } }),
    ]);

    const porCedula = new Map<string, any>();
    for (const fila of filas) {
      if (fila.cc && fila.cc !== 'N/A') porCedula.set(fila.cc, fila);
    }

    const novedadVigente = (cedula: string) =>
      novedadesAprobadas.find(
        (n) => n.cedula === cedula && n.fechaInicio <= fecha && fecha <= n.fechaFin,
      );

    const filasFinal: Partial<AsistenciaDiariaResumen>[] = [];

    // 1. Roster programado: cruza cada empleado esperado contra lo que marcó.
    for (const r of roster) {
      const fila = porCedula.get(r.cedula);
      porCedula.delete(r.cedula);
      filasFinal.push(
        this.armarFila({
          cedula: r.cedula,
          nombre: r.nombre,
          employee_id_odoo: r.id_odoo,
          departamento: r.departamento,
          company: company ?? null,
          fecha,
          horaProgramada: r.hora_inicio,
          fila,
          novedad: novedadVigente(r.cedula),
        }),
      );
    }

    // 2. Marcaciones sin malla vigente ese día (no estaban en el roster) → NO_PROGRAMADO.
    for (const fila of porCedula.values()) {
      filasFinal.push(
        this.armarFila({
          cedula: fila.cc,
          nombre: fila.empleado,
          employee_id_odoo: null,
          departamento: fila.department_id ?? null,
          company: company ?? null,
          fecha,
          horaProgramada: null,
          fila,
          novedad: novedadVigente(fila.cc),
        }),
      );
    }

    for (const registro of filasFinal) {
      await this.resumenRepo.upsert(registro, ['cedula', 'fecha', 'company']);
    }
    return filasFinal.length;
  }

  private armarFila(params: {
    cedula: string;
    nombre: string;
    employee_id_odoo: number | null;
    departamento: string | null;
    company: string | null;
    fecha: string;
    horaProgramada: number | null;
    fila: any | undefined;
    novedad: Novedad | undefined;
  }): Partial<AsistenciaDiariaResumen> {
    const { cedula, nombre, employee_id_odoo, departamento, company, fecha, horaProgramada, fila, novedad } = params;

    let estado: EstadoAsistenciaDiaria;
    let minutosTarde: number | null = null;
    let horaEntrada: string | null = null;
    let horaSalida: string | null = null;

    if (!fila) {
      // Programado pero sin marcación ese día.
      estado = horaProgramada != null ? 'AUSENTE' : 'NO_PROGRAMADO';
    } else {
      horaEntrada = fila.check_in ?? null;
      horaSalida = fila.check_out ?? null;
      if (horaProgramada == null) {
        estado = 'NO_PROGRAMADO';
      } else if (!fila.check_out || fila.estado === 'En curso') {
        estado = 'INCOMPLETO';
        minutosTarde = this.calcularMinutosTarde(fila.check_in, horaProgramada);
      } else if (fila.c_entrada === 'ENTRADA TARDE') {
        estado = 'TARDE';
        minutosTarde = this.calcularMinutosTarde(fila.check_in, horaProgramada);
      } else {
        estado = 'PUNTUAL';
        minutosTarde = 0;
      }
    }

    const ausenciaJustificada = estado === 'AUSENTE' ? !!novedad : null;

    return {
      cedula,
      nombre,
      employee_id_odoo,
      departamento,
      company,
      fecha,
      hora_programada: horaProgramada,
      hora_entrada: horaEntrada,
      hora_salida: horaSalida,
      minutos_tarde: minutosTarde,
      estado,
      ausencia_justificada: ausenciaJustificada,
      novedad_tipificacion: novedad?.tipificacion ?? null,
    };
  }

  /** Minutos de diferencia entre `checkIn` (local "YYYY-MM-DD HH:mm:ss") y la hora programada (decimal, ej. 7.5 = 07:30). Negativo si llegó antes; nunca negativo en el resultado (early = 0). */
  private calcularMinutosTarde(checkIn: string | null, horaProgramada: number): number | null {
    if (!checkIn) return null;
    const horaParte = checkIn.split(' ')[1];
    if (!horaParte) return null;
    const [h, m] = horaParte.split(':').map(Number);
    const minutosReales = h * 60 + m;
    const minutosProgramados = Math.round(horaProgramada * 60);
    return Math.max(0, minutosReales - minutosProgramados);
  }

  private rangoDeDias(startDate: string, endDate: string): string[] {
    const dias: string[] = [];
    const [ys, ms, ds] = startDate.split('-').map(Number);
    const [ye, me, de] = endDate.split('-').map(Number);
    const cursor = new Date(Date.UTC(ys, ms - 1, ds));
    const fin = new Date(Date.UTC(ye, me - 1, de));
    while (cursor.getTime() <= fin.getTime()) {
      dias.push(
        `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, '0')}-${String(cursor.getUTCDate()).padStart(2, '0')}`,
      );
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return dias;
  }
}
