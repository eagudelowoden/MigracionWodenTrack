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

        // 2. Buscar malla por nombre
        const malla = await this.mallaRepo.findOne({
          where: { nombre: nombreMalla },
        });

        if (!malla) {
          errores.push({
            fila: rowNumber,
            error: `Malla "${nombreMalla}" no existe en la DB`,
          });
          continue;
        }

        // 3. Cerrar asignación vigente anterior
        await this.asignacionRepo
          .createQueryBuilder()
          .update()
          .set({ fecha_fin: fechaInicio })
          .where('usuario_id_odoo = :id AND fecha_fin IS NULL', {
            id: usuario.id_odoo,
          })
          .execute();

        // 4. Crear nueva asignación
        const nueva = this.asignacionRepo.create({
          usuario_id_odoo: usuario.id_odoo,
          malla_id: malla.id,
          fecha_inicio: fechaInicio,
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
