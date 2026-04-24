import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { MallaHoraria } from './entities/malla-horaria.entity';
import { MallaDetalle } from './entities/malla-detalle.entity';

@Injectable()
export class MallasCrudService {
  constructor(
    @InjectRepository(MallaHoraria)
    private readonly mallaRepo: Repository<MallaHoraria>,
    @InjectRepository(MallaDetalle)
    private readonly detalleRepo: Repository<MallaDetalle>,
  ) {}

  async listar() {
    return this.mallaRepo.find({
      relations: ['detalles'],
      order: { nombre: 'ASC' },
    });
  }

  async crear(body: { nombre: string; compania: string; detalles: any[] }) {
    if (!body.nombre?.trim()) throw new BadRequestException('El nombre es requerido');

    const malla = this.mallaRepo.create({
      nombre: body.nombre.trim(),
      compania: body.compania?.trim() || undefined,
      activa: true,
    });
    await this.mallaRepo.save(malla);

    if (body.detalles?.length) {
      const detalles = body.detalles
        .filter((d) => d.activo !== false)
        .map((d) =>
          this.detalleRepo.create({
            malla_id: malla.id,
            dia_semana: Number(d.dia_semana),
            hora_inicio: Number(d.hora_inicio),
            hora_fin: Number(d.hora_fin),
            periodo: d.periodo || 'morning',
          }),
        );
      await this.detalleRepo.save(detalles);
    }

    return this.mallaRepo.findOne({ where: { id: malla.id }, relations: ['detalles'] });
  }

  async eliminar(id: number) {
    await this.detalleRepo.delete({ malla_id: id });
    await this.mallaRepo.delete(id);
    return { ok: true };
  }

  async toggleActiva(id: number, activa: boolean) {
    await this.mallaRepo.update(id, { activa });
    return { ok: true };
  }

  async procesarExcelCreacion(buffer: Buffer) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
    const ws = workbook.getWorksheet(1);
    if (!ws) throw new BadRequestException('No se encontró hoja de trabajo');

    // Agrupar filas por nombre de malla
    const mallasMap = new Map<string, { compania: string; detalles: any[] }>();

    ws.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const nombre = row.getCell(1).text?.trim();
      const compania = row.getCell(2).text?.trim();
      const diaSemana = Number(row.getCell(3).text?.trim());
      const horaInicio = parseFloat(row.getCell(4).text?.trim().replace(',', '.'));
      const horaFin = parseFloat(row.getCell(5).text?.trim().replace(',', '.'));
      const periodo = row.getCell(6).text?.trim() || 'morning';

      if (!nombre || isNaN(diaSemana) || isNaN(horaInicio) || isNaN(horaFin)) return;

      if (!mallasMap.has(nombre)) {
        mallasMap.set(nombre, { compania: compania || '', detalles: [] });
      }
      mallasMap.get(nombre)!.detalles.push({ dia_semana: diaSemana, hora_inicio: horaInicio, hora_fin: horaFin, periodo });
    });

    const creadas: string[] = [];
    const omitidas: string[] = [];
    const errores: string[] = [];

    for (const [nombre, data] of mallasMap.entries()) {
      try {
        const existe = await this.mallaRepo.findOne({ where: { nombre } });
        if (existe) {
          omitidas.push(nombre);
          continue;
        }
        await this.crear({ nombre, compania: data.compania, detalles: data.detalles });
        creadas.push(nombre);
      } catch (e) {
        errores.push(`"${nombre}": ${e.message}`);
      }
    }

    return {
      success: errores.length === 0,
      creadas: creadas.length,
      omitidas: omitidas.length,
      errores,
      detalle: { creadas, omitidas },
    };
  }

  generarPlantillaExcel() {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Mallas');

    ws.columns = [
      { header: 'nombre', key: 'nombre', width: 40 },
      { header: 'compania', key: 'compania', width: 30 },
      { header: 'dia_semana (0=Lun…6=Dom)', key: 'dia_semana', width: 24 },
      { header: 'hora_inicio', key: 'hora_inicio', width: 14 },
      { header: 'hora_fin', key: 'hora_fin', width: 14 },
      { header: 'periodo (morning/afternoon/night)', key: 'periodo', width: 30 },
    ];

    const ejemplos = [
      ['(ADM) ADMIN-001 Colombia L-V 7-17', '(CO) WODEN COLOMBIA SAS', 0, 7, 17, 'morning'],
      ['(ADM) ADMIN-001 Colombia L-V 7-17', '(CO) WODEN COLOMBIA SAS', 1, 7, 17, 'morning'],
      ['(ADM) ADMIN-001 Colombia L-V 7-17', '(CO) WODEN COLOMBIA SAS', 2, 7, 17, 'afternoon'],
      ['(ADM) ADMIN-001 Colombia L-V 7-17', '(CO) WODEN COLOMBIA SAS', 3, 7, 17, 'afternoon'],
      ['(ADM) ADMIN-001 Colombia L-V 7-17', '(CO) WODEN COLOMBIA SAS', 4, 7, 16, 'morning'],
    ];

    ejemplos.forEach((row) => ws.addRow(row));

    // Estilo de cabecera
    ws.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF8F00' } };
    });

    return workbook;
  }
}
