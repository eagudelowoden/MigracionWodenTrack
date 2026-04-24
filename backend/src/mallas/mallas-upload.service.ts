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
  ) {}

  async procesarExcel(fileBuffer: any) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) throw new Error('No se encontró hoja de trabajo.');

    const procesados: number[] = [];
    const errores: { fila: number; error: string }[] = [];

    const rows: any[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // saltar cabecera
      rows.push({ row, rowNumber });
    });

    for (const { row, rowNumber } of rows) {
      try {
        const cedula = row.getCell(1).text?.trim();
        const nombreMalla = row.getCell(2).text?.trim();
        const fechaInicio =
          row.getCell(3).text?.trim() || new Date().toISOString().slice(0, 10);

        if (!cedula || !nombreMalla) {
          errores.push({
            fila: rowNumber,
            error: 'Cédula o nombre de malla vacío',
          });
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
            error: `Empleado con cédula ${cedula} no encontrado`,
          });
          continue;
        }

        // 2. Buscar malla por nombre — preferir la que tiene detalles
        const mallas = await this.mallaRepo.find({
          where: { nombre: nombreMalla, activa: true },
          relations: ['detalles'],
          order: { id: 'DESC' },
        });

        if (!mallas.length) {
          errores.push({
            fila: rowNumber,
            error: `Malla "${nombreMalla}" no existe en la DB`,
          });
          continue;
        }

        // Tomar la que tiene detalles; si ninguna tiene, tomar la más reciente
        const malla =
          mallas.find((m) => m.detalles && m.detalles.length > 0) || mallas[0];

        // 3. Marcar todas las asignaciones anteriores del usuario como no actuales
        await this.asignacionRepo
          .createQueryBuilder()
          .update()
          .set({ actual: false })
          .where('usuario_id_odoo = :id AND actual = true', {
            id: usuario.id_odoo,
          })
          .execute();

        // 4. Crear nueva asignación marcada como actual
        const nueva = this.asignacionRepo.create({
          usuario_id_odoo: usuario.id_odoo,
          malla_id: malla.id,
          fecha_inicio: fechaInicio,
          actual: true,
        });
        await this.asignacionRepo.save(nueva);
        procesados.push(usuario.id_odoo);
      } catch (e) {
        errores.push({ fila: rowNumber, error: e.message });
      }
    }

    return {
      success: errores.length === 0,
      message: `${procesados.length} mallas asignadas correctamente`,
      total_procesados: procesados.length,
      errors: errores,
    };
  }
}
