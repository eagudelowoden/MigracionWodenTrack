import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { MallaHoraria } from './entities/malla-horaria.entity';
import { MallaDetalle } from './entities/malla-detalle.entity';
import { MallaAsignacion } from './entities/malla-asignacion.entity';

@Injectable()
export class MallasLocalService {
  constructor(
    @InjectRepository(MallaHoraria)
    private readonly mallaRepo: Repository<MallaHoraria>,
    @InjectRepository(MallaDetalle)
    private readonly detalleRepo: Repository<MallaDetalle>,
    @InjectRepository(MallaAsignacion)
    private readonly asignacionRepo: Repository<MallaAsignacion>,
  ) {}

  // Obtener malla vigente de un empleado en una fecha
  async getMallaVigenteDeEmpleado(
    idOdoo: number,
    fecha: string, // YYYY-MM-DD
  ): Promise<MallaHoraria | null> {
    const asignacion = await this.asignacionRepo.findOne({
      where: [
        {
          usuario_id_odoo: idOdoo,
          fecha_inicio: fecha,
          fecha_fin: IsNull(),
        },
      ],
      relations: ['malla', 'malla.detalles'],
      order: { fecha_inicio: 'DESC' },
    });

    // Si no encontró con fecha exacta, buscar la más reciente antes de esa fecha
    if (!asignacion) {
      const asignaciones = await this.asignacionRepo
        .createQueryBuilder('a')
        .leftJoinAndSelect('a.malla', 'malla')
        .leftJoinAndSelect('malla.detalles', 'detalles')
        .where('a.usuario_id_odoo = :id', { id: idOdoo })
        .andWhere('a.fecha_inicio <= :fecha', { fecha })
        .andWhere('(a.fecha_fin IS NULL OR a.fecha_fin >= :fecha)', { fecha })
        .orderBy('a.fecha_inicio', 'DESC')
        .getOne();

      return asignaciones?.malla || null;
    }

    return asignacion.malla;
  }

  // Obtener detalles de malla para un día específico
  getMallaParaDia(
    malla: MallaHoraria,
    diaSemana: number, // 0=Lun...6=Dom
  ): MallaDetalle | null {
    if (!malla?.detalles) return null;
    return (
      malla.detalles
        .filter((d) => d.dia_semana === diaSemana)
        .sort((a, b) => a.hora_inicio - b.hora_inicio)[0] || null
    );
  }

  // Clasificar entrada/salida contra la malla local
  clasificarContrasMallaLocal(
    malla: MallaHoraria,
    fechaHoraLocal: string, // "2026-04-16 07:05:54"
    esEntrada: boolean,
  ): string {
    const fecha = new Date(fechaHoraLocal.replace(' ', 'T'));
    const diaSemana = fecha.getDay() === 0 ? 6 : fecha.getDay() - 1;
    const horaDecimal = fecha.getHours() + fecha.getMinutes() / 60;

    const detalle = this.getMallaParaDia(malla, diaSemana);
    if (!detalle) return 'DÍA NO LABORABLE';

    const tolerancia = 6 / 60;

    if (esEntrada) {
      return horaDecimal > detalle.hora_inicio + tolerancia
        ? 'ENTRADA TARDE'
        : 'A TIEMPO';
    } else {
      return horaDecimal < detalle.hora_fin ? 'SALIDA ANTICIPADA' : 'A TIEMPO';
    }
  }

  // Cargar mallas desde Excel (formato del archivo subido)
  async cargarDesdeExcel(
    rows: any[],
  ): Promise<{ creadas: number; actualizadas: number; errores: string[] }> {
    let creadas = 0;
    let actualizadas = 0;
    const errores: string[] = [];

    for (const row of rows) {
      try {
        const nombreMalla =
          row['Horario de Trabajo'] || row['malla'] || row['nombre'];
        const idOdoo = row['id_odoo'] || row['ID Odoo'];
        const fechaInicio = row['Fecha Inicio'] || row['fecha_inicio'];

        if (!nombreMalla || !idOdoo) {
          errores.push(`Fila inválida: falta nombre de malla o id_odoo`);
          continue;
        }

        // Buscar o crear la malla
        let malla = await this.mallaRepo.findOne({
          where: { nombre: nombreMalla },
          relations: ['detalles'],
        });

        if (!malla) {
          malla = this.mallaRepo.create({ nombre: nombreMalla });
          await this.mallaRepo.save(malla);
          creadas++;
        }

        // Asignar al empleado
        // Cerrar asignación vigente anterior
        await this.asignacionRepo
          .createQueryBuilder()
          .update()
          .set({
            fecha_fin: fechaInicio || new Date().toISOString().slice(0, 10),
          })
          .where('usuario_id_odoo = :id AND fecha_fin IS NULL', { id: idOdoo })
          .execute();

        // Crear nueva asignación
        const nueva = this.asignacionRepo.create({
          usuario_id_odoo: Number(idOdoo),
          malla_id: malla.id,
          fecha_inicio: fechaInicio || new Date().toISOString().slice(0, 10),
        });
        await this.asignacionRepo.save(nueva);
        actualizadas++;
      } catch (e) {
        errores.push(`Error procesando fila: ${e.message}`);
      }
    }

    return { creadas, actualizadas, errores };
  }

  // Historial de mallas de un empleado
  async getHistorialEmpleado(idOdoo: number) {
    return this.asignacionRepo.find({
      where: { usuario_id_odoo: idOdoo },
      relations: ['malla'],
      order: { fecha_inicio: 'DESC' },
    });
  }

  // Listar todas las mallas
  async listarMallas(compania?: string) {
    const query = this.mallaRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.detalles', 'd')
      .where('m.activa = true');

    if (compania) {
      query.andWhere('m.compania = :compania', { compania });
    }

    return query.getMany();
  }
}
