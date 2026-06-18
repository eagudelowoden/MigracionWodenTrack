import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { MallaHoraria } from '../mallas/entities/malla-horaria.entity';
import { MallaAsignacion } from '../mallas/entities/malla-asignacion.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';

@Injectable()
export class MallasUploadService {
  constructor(
    @InjectRepository(MallaHoraria)
    private readonly mallaRepo: Repository<MallaHoraria>,
    @InjectRepository(MallaAsignacion)
    private readonly asignacionRepo: Repository<MallaAsignacion>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
  ) { }

  async procesarExcel(
    fileBuffer: any,
    asignado_por?: string,
    fecha_inicio_override?: string | null,
    fecha_fin?: string | null,
  ) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) throw new Error('No se encontró hoja de trabajo.');

    const procesados: { fila: number; cedula: string; nombre: string; malla: string; fecha: string }[] = [];
    const errores: { fila: number; cedula?: string; error: string }[] = [];

    const rows: any[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // saltar cabecera
      rows.push({ row, rowNumber });
    });

    for (const { row, rowNumber } of rows) {
      try {
        const cedula = row.getCell(1).text?.trim();
        const nombreMalla = row.getCell(2).text?.trim();
        const fechaInicio = fecha_inicio_override ||
          row.getCell(3).text?.trim() ||
          new Date().toLocaleString("sv-SE", { timeZone: "America/Bogota" }).slice(0, 10);
        const fechaFin = fecha_fin || null;

        // Fila completamente vacía → ignorar silenciosamente
        if (!cedula && !nombreMalla) continue;

        // Solo un campo vacío → error específico
        if (!cedula) {
          errores.push({ fila: rowNumber, error: 'La cédula está vacía' });
          continue;
        }
        if (!nombreMalla) {
          errores.push({ fila: rowNumber, cedula, error: `Cédula ${cedula}: no se indicó el nombre de la malla` });
          continue;
        }

        // 1. Buscar empleado por cédula en DB local
        const usuario = await this.usuarioRepo.findOne({
          where: { identificacion: cedula },
          select: ['id_odoo', 'nombre'],
        });

        if (!usuario) {
          errores.push({
            fila: rowNumber,
            cedula,
            error: `Cédula ${cedula} no encontrada en el sistema`,
          });
          continue;
        }

        // 2. Buscar malla normalizando espacios en ambos lados (BD puede tener dobles espacios)
        const normalizar = (s: string) => s.replace(/\s+/g, ' ').trim().toUpperCase();
        const nombreNormalizado = normalizar(nombreMalla);

        const todasMallas = await this.mallaRepo
          .createQueryBuilder('m')
          .leftJoinAndSelect('m.detalles', 'd')
          .where('m.activa = :activa', { activa: true })
          .orderBy('m.id', 'DESC')
          .getMany();

        const mallasResult = todasMallas.filter(
          (m) => normalizar(m.nombre) === nombreNormalizado,
        );

        if (!mallasResult.length) {
          errores.push({
            fila: rowNumber,
            cedula,
            error: `Malla "${nombreMalla}" no existe en el sistema`,
          });
          continue;
        }

        // Tomar la que tiene detalles; si ninguna tiene, tomar la más reciente
        const malla =
          mallasResult.find((m) => m.detalles && m.detalles.length > 0) || mallasResult[0];

        // Helpers de fecha locales
        const sumarDias = (f: string, dias: number): string => {
          const [y, m, d] = f.split('-').map(Number);
          const dt = new Date(y, m - 1, d + dias);
          return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
        };
        const fechaAnterior = sumarDias(fechaInicio, -1); // A-1

        if (fechaFin) {
          // Asignación temporal [A, B]:
          // 1. Asignaciones que EMPIEZAN dentro de [A,B] y se extienden más allá de B
          //    → desplazar su fecha_inicio a B+1 para que reanuden después del período temporal.
          const fechaDespues = sumarDias(fechaFin, 1); // B+1
          await this.asignacionRepo
            .createQueryBuilder()
            .update()
            .set({ fecha_inicio: fechaDespues, actual: false })
            .where(
              `usuario_id_odoo = :id
               AND fecha_inicio >= :a AND fecha_inicio <= :b
               AND (fecha_fin IS NULL OR fecha_fin > :b)`,
              { id: usuario.id_odoo, a: fechaInicio, b: fechaFin },
            )
            .execute();

          // 2. Todo lo demás que solapa con [A,B]: recortar para que termine en A-1
          //    (cubre: permanentes desde antes de A, temporales enteramente dentro de [A,B])
          await this.asignacionRepo
            .createQueryBuilder()
            .update()
            .set({ actual: false, fecha_fin: fechaAnterior })
            .where(
              `usuario_id_odoo = :id
               AND fecha_inicio <= :b
               AND (fecha_fin IS NULL OR fecha_fin >= :a)`,
              { id: usuario.id_odoo, a: fechaInicio, b: fechaFin },
            )
            .execute();

          const temporal = this.asignacionRepo.create({
            usuario_id_odoo: usuario.id_odoo,
            malla_id: malla.id,
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            actual: false,
            asignado_por: asignado_por || undefined,
          });
          await this.asignacionRepo.save(temporal);
        } else {
          // Asignación permanente (sin fecha_fin):
          // Cerrar TODAS las asignaciones que solapan con la nueva fecha de inicio,
          // incluyendo temporales (actual=false) que antes quedaban sin cerrar.
          await this.asignacionRepo
            .createQueryBuilder()
            .update()
            .set({ actual: false, fecha_fin: fechaAnterior })
            .where(
              'usuario_id_odoo = :id AND (fecha_fin IS NULL OR fecha_fin >= :fi)',
              { id: usuario.id_odoo, fi: fechaInicio },
            )
            .execute();

          const nueva = this.asignacionRepo.create({
            usuario_id_odoo: usuario.id_odoo,
            malla_id: malla.id,
            fecha_inicio: fechaInicio,
            fecha_fin: null,
            actual: true,
            asignado_por: asignado_por || undefined,
          });
          await this.asignacionRepo.save(nueva);
        }
        procesados.push({ fila: rowNumber, cedula, nombre: usuario.nombre, malla: malla.nombre, fecha: fechaInicio });
      } catch (e) {
        errores.push({ fila: rowNumber, error: e.message });
      }
    }

    return {
      success: errores.length === 0,
      message: `${procesados.length} malla${procesados.length !== 1 ? 's' : ''} asignada${procesados.length !== 1 ? 's' : ''} correctamente`,
      total_procesados: procesados.length,
      procesados,
      errors: errores,
    };
  }
}
