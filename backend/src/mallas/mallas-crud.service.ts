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

    const parseHora = (val: string | undefined): number => {
      if (!val) return NaN;
      const clean = val.trim();
      if (!clean) return NaN;
      // "7:00 AM", "07:00:00", "07:00"
      if (clean.includes(':')) {
        const parts = clean.split(':');
        const h = Number(parts[0]);
        const m = Number(parts[1]) || 0;
        const suffix = (parts[1] || '').replace(/[^a-zA-Z]/g, '').toUpperCase();
        if (isNaN(h)) return NaN;
        // Corregir formato 12h → 24h
        if (suffix === 'PM' && h < 12) return h + 12 + m / 60;
        if (suffix === 'AM' && h === 12) return m / 60;
        return h + m / 60;
      }
      return parseFloat(clean.replace(',', '.'));
    };

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
    // Usar worksheets[0] (por posición) en vez de getWorksheet(1) (por sheetId)
    // para evitar fallos cuando el sheetId no es 1
    const ws = workbook.worksheets[0];
    if (!ws) throw new BadRequestException('No se encontró hoja de trabajo');

    // Extraer "H:MM" de un objeto Date (ExcelJS usa UTC para tiempo puro)
    const dateToHHMM = (d: Date): string =>
      `${d.getUTCHours()}:${String(d.getUTCMinutes()).padStart(2, '0')}`;

    // Leer texto de celda con fallback a .value cuando la celda es de tipo TIME
    const getCellString = (cell: ExcelJS.Cell): string => {
      const text = cell.text?.trim();
      if (text) return text;
      const val = cell.value;
      if (typeof val === 'string') return val.trim();
      if (typeof val === 'number') return String(val);
      if (val instanceof Date) return dateToHHMM(val);
      return '';
    };

    // Leer celda de hora con fallback robusto para celdas TIME de Excel.
    // IMPORTANTE: cell.value instanceof Date tiene PRIORIDAD sobre cell.text porque
    // ExcelJS puede poner en .text el resultado de Date.toString() con el offset
    // histórico de Colombia en 1899 (-04:56:16), que hace que getHours() devuelva
    // valores incorrectos (ej. 17 en lugar de 22). Usando getUTCHours() se obtiene
    // siempre el valor correcto independientemente de la hora (06, 14, 15, 22…).
    const getCellHora = (cell: ExcelJS.Cell): string => {
      const val = cell.value;
      // 1. Celda tipo Date (tiempo sin fecha → 1899-12-30 + fracción): usar UTC
      if (val instanceof Date) return dateToHHMM(val);
      // 2. Número: fracción de día (0–1) o decimal de hora (≥2)
      if (typeof val === 'number') {
        const hours = val < 1 ? val * 24 : val;
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return `${h}:${String(m).padStart(2, '0')}`;
      }
      // 3. Texto plano ("14:00", "10:00:00 p. m.", etc.)
      const text = cell.text?.trim();
      if (text) return text;
      if (typeof val === 'string') return val.trim();
      return '';
    };

    // ─── Detectar formato: VERTICAL (plantilla) vs HORIZONTAL (días como columnas) ───
    const headerRow = ws.getRow(1);
    const col2Header = getCellString(headerRow.getCell(2)).toLowerCase().normalize('NFC').trim();
    const isHorizontal = col2Header in DIA_MAP; // "lunes","martes"… → formato horizontal

    // Agrupar filas por nombre de malla
    const mallasMap = new Map<string, { compania: string; detalles: any[] }>();
    const advertencias: string[] = [];
    let totalFilas = 0;

    if (isHorizontal) {
      // ════════════════════════════════════════════════════════
      // FORMATO HORIZONTAL: una fila por turno, días como columnas
      // Ejemplo: TURNO | LUNES | MARTES | ... | SÁBADO
      //          Turno1 | "8:00 AM a 2:00PM" | ...
      // ════════════════════════════════════════════════════════
      console.log('[MallasCrud] Formato detectado: HORIZONTAL');

      // 1. Mapear columnas a números de día (ignorar columnas no-día como ALMUERZO)
      const dayColumns = new Map<number, number>(); // colIdx → diaSemana (0-6)
      for (let c = 2; c <= (ws.columnCount || 10); c++) {
        const headerText = getCellString(headerRow.getCell(c)).toLowerCase().normalize('NFC').trim();
        if (headerText in DIA_MAP) {
          dayColumns.set(c, DIA_MAP[headerText]);
        }
      }

      // 2. Parsear "8:00 AM a 2:00PM" → { horaInicio, horaFin }
      const parseRango = (rango: string): { horaInicio: number; horaFin: number } | null => {
        if (!rango || rango === '-') return null;
        // Separador: " a ", " A ", " - " (sin confundir con "-" solo)
        const partes = rango.split(/\s+[aA]\s+/);
        if (partes.length < 2) return null;
        const horaInicio = parseHora(partes[0].trim());
        const horaFin = parseHora(partes[1].trim());
        if (isNaN(horaInicio) || isNaN(horaFin)) return null;
        return { horaInicio, horaFin };
      };

      // 3. Iterar filas de datos
      ws.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const nombre = getCellString(row.getCell(1)).trim();
        if (!nombre) return;
        totalFilas++;

        for (const [colIdx, diaSemana] of dayColumns.entries()) {
          const rangoRaw = getCellString(row.getCell(colIdx)).trim();
          const parsed = parseRango(rangoRaw);
          if (!parsed) continue;

          const { horaInicio, horaFin } = parsed;
          const periodo = horaInicio < 12 ? 'morning' : horaInicio < 18 ? 'afternoon' : 'night';

          if (!mallasMap.has(nombre)) {
            mallasMap.set(nombre, { compania: '', detalles: [] });
          }
          mallasMap.get(nombre)!.detalles.push({ dia_semana: diaSemana, hora_inicio: horaInicio, hora_fin: horaFin, periodo });
        }

        if (!mallasMap.has(nombre)) {
          advertencias.push(`Fila ${rowNumber} (${nombre}): ningún horario válido encontrado`);
        }
      });

    } else {
      // ════════════════════════════════════════════════════════
      // FORMATO VERTICAL (plantilla estándar):
      // nombre | compania | dia | hora_inicio | hora_fin | periodo
      // ════════════════════════════════════════════════════════
      console.log('[MallasCrud] Formato detectado: VERTICAL');

      ws.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const nombre = getCellString(row.getCell(1));
        if (!nombre) return;
        totalFilas++;

        const compania = getCellString(row.getCell(2));
        const diaRaw = getCellString(row.getCell(3)).toLowerCase().normalize('NFC');
        const diaSemana = diaRaw !== '' ? DIA_MAP[diaRaw] : undefined;
        const horaInicioRaw = getCellHora(row.getCell(4));
        const horaFinRaw = getCellHora(row.getCell(5));
        const horaInicio = parseHora(horaInicioRaw);
        const horaFin = parseHora(horaFinRaw);
        const periodo = getCellString(row.getCell(6)) || 'morning';

        if (diaSemana === undefined) {
          advertencias.push(`Fila ${rowNumber} (${nombre}): día no reconocido → "${diaRaw || '(vacío)'}"`);
          return;
        }
        if (isNaN(horaInicio)) {
          advertencias.push(`Fila ${rowNumber} (${nombre}): hora inicio inválida → "${horaInicioRaw || '(vacío)'}"`);
          return;
        }
        if (isNaN(horaFin)) {
          advertencias.push(`Fila ${rowNumber} (${nombre}): hora fin inválida → "${horaFinRaw || '(vacío)'}"`);
          return;
        }

        if (!mallasMap.has(nombre)) {
          mallasMap.set(nombre, { compania, detalles: [] });
        }
        mallasMap.get(nombre)!.detalles.push({ dia_semana: diaSemana, hora_inicio: horaInicio, hora_fin: horaFin, periodo });
      });
    }

    console.log(`[MallasCrud] ${isHorizontal ? 'Horizontal' : 'Vertical'}: ${totalFilas} filas, ${mallasMap.size} mallas, ${advertencias.length} advertencias`);
    if (advertencias.length) console.log('[MallasCrud] Advertencias:', advertencias.slice(0, 5));

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
      advertencias: advertencias.slice(0, 20),
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
