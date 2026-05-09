import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { MallaHoraria } from './entities/malla-horaria.entity';
import { MallaDetalle } from './entities/malla-detalle.entity';
import { MallaAsignacion } from './entities/malla-asignacion.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Area } from '../usuarios/entities/area.entity';

const DIAS_NOMBRE = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function formatHoraDecimal(decimal: number): string {
  const h = Math.floor(decimal).toString().padStart(2, '0');
  const m = Math.round((decimal % 1) * 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

@Injectable()
export class MallasCrudService {
  constructor(
    @InjectRepository(MallaHoraria)
    private readonly mallaRepo: Repository<MallaHoraria>,
    @InjectRepository(MallaDetalle)
    private readonly detalleRepo: Repository<MallaDetalle>,
    @InjectRepository(MallaAsignacion)
    private readonly asignacionRepo: Repository<MallaAsignacion>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(Area)
    private readonly areaRepo: Repository<Area>,
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
    await this.asignacionRepo.delete({ malla_id: id });
    await this.detalleRepo.delete({ malla_id: id });
    await this.mallaRepo.delete(id);
    return { ok: true };
  }

  async toggleActiva(id: number, activa: boolean) {
    await this.mallaRepo.update(id, { activa });
    return { ok: true };
  }


  async procesarExcelCreacion(buffer: Buffer) {
    const DIA_MAP: Record<string, number> = {
      lunes: 0, martes: 1, miercoles: 2, miércoles: 2,
      jueves: 3, viernes: 4, sabado: 5, sábado: 5, domingo: 6,
      '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
    };

    const parseHora = (val: string): number => {
      if (!val) return NaN;
      if (val.includes(':')) {
        const [h, m] = val.split(':').map(Number);
        return h + (m || 0) / 60;
      }
      return parseFloat(val.replace(',', '.'));
    };

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
      const diaRaw = row.getCell(3).text?.trim().toLowerCase();
      const diaSemana = diaRaw !== undefined && diaRaw !== '' ? DIA_MAP[diaRaw] : undefined;
      const horaInicio = parseHora(row.getCell(4).text?.trim());
      const horaFin = parseHora(row.getCell(5).text?.trim());
      const periodo = row.getCell(6).text?.trim() || 'morning';

      if (!nombre || diaSemana === undefined || isNaN(horaInicio) || isNaN(horaFin)) return;

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

  async getMallasPorDepartamento(departamento?: string): Promise<any[]> {
    const qb = this.asignacionRepo
      .createQueryBuilder('asig')
      .innerJoin('asig.usuario', 'u')
      .innerJoin('u.area', 'area')
      .innerJoin('asig.malla', 'malla')
      .leftJoin('malla.detalles', 'detalle')
      .select([
        'area.departamento',
        'malla.id',
        'malla.nombre',
        'detalle.dia_semana',
        'detalle.hora_inicio',
        'detalle.hora_fin',
      ])
      .where('asig.actual = 1')
      .andWhere('u.is_active = 1')
      .andWhere('area.departamento IS NOT NULL');

    if (departamento) {
      qb.andWhere('area.departamento = :departamento', { departamento });
    }

    const rows = await qb.getRawMany();

    const deptMap = new Map<string, Map<number, { id: number; nombre: string; detalles: any[] }>>();
    const seen = new Set<string>();

    for (const row of rows) {
      const dept: string = row['area_departamento'];
      const mallaId = Number(row['malla_id']);
      const mallaNombre: string = row['malla_nombre'];

      if (!deptMap.has(dept)) deptMap.set(dept, new Map());
      const mallaMap = deptMap.get(dept)!;

      if (!mallaMap.has(mallaId)) {
        mallaMap.set(mallaId, { id: mallaId, nombre: mallaNombre, detalles: [] });
      }

      const dia = row['detalle_dia_semana'];
      if (dia !== null && dia !== undefined) {
        const key = `${dept}|${mallaId}|${dia}`;
        if (!seen.has(key)) {
          seen.add(key);
          mallaMap.get(mallaId)!.detalles.push({
            dia_semana: Number(dia),
            hora_inicio: Number(row['detalle_hora_inicio']),
            hora_fin: Number(row['detalle_hora_fin']),
          });
        }
      }
    }

    const result: any[] = [];
    for (const [dept, mallaMap] of deptMap) {
      result.push({
        departamento: dept,
        mallas: Array.from(mallaMap.values())
          .map((m) => ({
            ...m,
            detalles: m.detalles.sort((a, b) => a.dia_semana - b.dia_semana),
          }))
          .sort((a, b) => a.nombre.localeCompare(b.nombre)),
      });
    }

    return result.sort((a, b) => a.departamento.localeCompare(b.departamento));
  }

  async exportarMallasPorDepartamentoExcel(departamento?: string) {
    const datos = await this.getMallasPorDepartamento(departamento);

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Mallas por Departamento');

    ws.columns = [
      { header: 'Departamento', key: 'departamento', width: 28 },
      { header: 'Malla', key: 'malla', width: 48 },
      { header: 'Días y Horarios', key: 'dias', width: 70 },
    ];

    ws.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
    });

    for (const grupo of datos) {
      for (const malla of grupo.mallas) {
        const diasStr = malla.detalles
          .map(
            (d: any) =>
              `${DIAS_NOMBRE[d.dia_semana]} ${formatHoraDecimal(d.hora_inicio)}-${formatHoraDecimal(d.hora_fin)}`,
          )
          .join(', ');

        ws.addRow({ departamento: grupo.departamento, malla: malla.nombre, dias: diasStr });
      }
    }

    return workbook;
  }

  generarPlantillaExcel() {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Mallas');

    ws.columns = [
      { header: 'nombre', key: 'nombre', width: 40 },
      { header: 'compania', key: 'compania', width: 30 },
      { header: 'dia (Lunes/Martes/Miércoles/Jueves/Viernes/Sábado/Domingo)', key: 'dia', width: 48 },
      { header: 'hora_inicio (HH:MM)', key: 'hora_inicio', width: 20 },
      { header: 'hora_fin (HH:MM)', key: 'hora_fin', width: 18 },
      { header: 'periodo (morning/afternoon/night)', key: 'periodo', width: 30 },
    ];

    const ejemplos = [
      ['(ADM) ADMIN-001 Colombia L-V 7-17', '(CO) WODEN COLOMBIA SAS', 'Lunes',     '07:00', '17:00', 'morning'],
      ['(ADM) ADMIN-001 Colombia L-V 7-17', '(CO) WODEN COLOMBIA SAS', 'Martes',    '07:00', '17:00', 'morning'],
      ['(ADM) ADMIN-001 Colombia L-V 7-17', '(CO) WODEN COLOMBIA SAS', 'Miércoles', '07:00', '17:00', 'afternoon'],
      ['(ADM) ADMIN-001 Colombia L-V 7-17', '(CO) WODEN COLOMBIA SAS', 'Jueves',    '07:00', '17:00', 'afternoon'],
      ['(ADM) ADMIN-001 Colombia L-V 7-17', '(CO) WODEN COLOMBIA SAS', 'Viernes',   '07:00', '16:00', 'morning'],
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
