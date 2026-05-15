import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { Area } from './entities/area.entity';
import { MallaAsignacion } from '../mallas/entities/malla-asignacion.entity';
import { MallaHoraria } from '../mallas/entities/malla-horaria.entity';
import { OdooService } from '../odoo/odoo.service';

@Injectable()
export class SuperAdminAnaliticaService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(Area)
    private readonly areaRepo: Repository<Area>,
    @InjectRepository(MallaAsignacion)
    private readonly asignacionRepo: Repository<MallaAsignacion>,
    @InjectRepository(MallaHoraria)
    private readonly mallaRepo: Repository<MallaHoraria>,
    private readonly odoo: OdooService,
  ) {}

  // ── Sin malla ────────────────────────────────────────────────
  async getEmpleadosSinMalla(): Promise<any[]> {
    const conMalla = await this.asignacionRepo
      .createQueryBuilder('a')
      .select('a.usuario_id_odoo')
      .where('a.actual = 1')
      .getRawMany();

    const conMallaIds: number[] = conMalla.map((r) => r['a_usuario_id_odoo']);

    const qb = this.usuarioRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.area', 'area')
      .leftJoinAndSelect('u.segmento', 'segmento')
      .where('u.is_active = 1');

    if (conMallaIds.length > 0) {
      qb.andWhere('u.id_odoo NOT IN (:...ids)', { ids: conMallaIds });
    }

    const usuarios = await qb.getMany();

    return usuarios.map((u) => ({
      id_odoo: u.id_odoo,
      nombre: u.nombre,
      cargo: u.cargo || 'Sin cargo',
      departamento: u.departamento || u.area?.departamento || 'Sin departamento',
      area: u.area?.nombre || 'Sin área',
      segmento: (u as any).segmento?.nombre || 'Sin segmento',
    }));
  }

  // ── Asignación masiva ────────────────────────────────────────
  async asignarMallasMasivo(
    asignaciones: { usuarioIdOdoo: number; mallaId: number }[],
    asignadoPor: string,
  ): Promise<{ procesados: number }> {
    const hoy = new Date().toISOString().split('T')[0];

    for (const { usuarioIdOdoo, mallaId } of asignaciones) {
      // Desactivar asignaciones anteriores
      await this.asignacionRepo
        .createQueryBuilder()
        .update()
        .set({ actual: () => '0', fecha_fin: hoy })
        .where('usuario_id_odoo = :id AND actual = 1', { id: usuarioIdOdoo })
        .execute();

      // Crear nueva asignación
      const nueva = this.asignacionRepo.create({
        usuario_id_odoo: usuarioIdOdoo,
        malla_id: mallaId,
        fecha_inicio: hoy,
        fecha_fin: null,
        asignado_por: asignadoPor,
      });
      const saved = await this.asignacionRepo.save(nueva);

      // Marcar como actual
      await this.asignacionRepo
        .createQueryBuilder()
        .update()
        .set({ actual: () => '1' })
        .where('id = :id', { id: saved.id })
        .execute();
    }

    return { procesados: asignaciones.length };
  }

  // ── Comparativa de áreas ─────────────────────────────────────
  async getComparativaAreas(startDate: string, endDate: string): Promise<any[]> {
    const usuarios = await this.usuarioRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.area', 'area')
      .where('u.is_active = 1')
      .andWhere('u.area_id IS NOT NULL')
      .getMany();

    if (!usuarios.length) return [];

    const idOdoos = usuarios.map((u) => u.id_odoo).filter(Boolean);

    const uid = await this.odoo.authenticate();
    const records = await this.odoo.executeKw<any[]>(
      'hr.attendance',
      'search_read',
      [[
        ['employee_id', 'in', idOdoos],
        ['check_in', '>=', `${startDate} 00:00:00`],
        ['check_in', '<=', `${endDate} 23:59:59`],
      ]],
      {
        fields: ['employee_id', 'check_in', 'x_studio_tipo_entrada', 'x_studio_tipo_salida'],
        limit: 10000,
      },
      uid,
    );

    // Mapa usuario → área
    const userAreaMap = new Map<number, { areaNombre: string; departamento: string }>();
    for (const u of usuarios) {
      userAreaMap.set(u.id_odoo, {
        areaNombre: u.area?.nombre || 'Sin área',
        departamento: u.area?.departamento || 'Sin departamento',
      });
    }

    // Inicializar acumuladores por área
    const areaMap = new Map<string, {
      areaNombre: string;
      departamento: string;
      empleadosSet: Set<number>;
      entradas: number;
      aTiempo: number;
      tardanza: number;
      salidaAnticipada: number;
      cierreAutomatico: number;
    }>();

    for (const u of usuarios) {
      const areaNombre = u.area?.nombre || 'Sin área';
      if (!areaMap.has(areaNombre)) {
        areaMap.set(areaNombre, {
          areaNombre,
          departamento: u.area?.departamento || 'Sin departamento',
          empleadosSet: new Set(),
          entradas: 0,
          aTiempo: 0,
          tardanza: 0,
          salidaAnticipada: 0,
          cierreAutomatico: 0,
        });
      }
      areaMap.get(areaNombre)!.empleadosSet.add(u.id_odoo);
    }

    for (const rec of records) {
      const empId: number = Array.isArray(rec.employee_id) ? rec.employee_id[0] : rec.employee_id;
      const areaInfo = userAreaMap.get(empId);
      if (!areaInfo) continue;

      const data = areaMap.get(areaInfo.areaNombre);
      if (!data) continue;

      data.entradas++;
      if (rec.x_studio_tipo_entrada === 'A TIEMPO') data.aTiempo++;
      if (rec.x_studio_tipo_entrada === 'ENTRADA TARDE') data.tardanza++;
      if (rec.x_studio_tipo_salida === 'SALIDA ANTICIPADA') data.salidaAnticipada++;
      if (rec.x_studio_tipo_salida === 'CIERRE AUTOMÁTICO') data.cierreAutomatico++;
    }

    const result: any[] = [];
    for (const [, data] of areaMap) {
      const totalEmpleados = data.empleadosSet.size;
      const puntualidadPct = data.entradas > 0 ? Math.round((data.aTiempo / data.entradas) * 100) : 0;
      const tardanzaPct = data.entradas > 0 ? Math.round((data.tardanza / data.entradas) * 100) : 0;

      // Estimación de ausentismo: días esperados vs marcaciones
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diasRango = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
      const diasLaborales = Math.ceil(diasRango * (5 / 7));
      const totalEsperado = totalEmpleados * diasLaborales;
      const ausentismoPct =
        totalEsperado > 0
          ? Math.min(100, Math.max(0, Math.round(((totalEsperado - data.entradas) / totalEsperado) * 100)))
          : 0;

      result.push({
        area: data.areaNombre,
        departamento: data.departamento,
        totalEmpleados,
        totalMarcaciones: data.entradas,
        aTiempoPct: puntualidadPct,
        tardanzaPct,
        salidaAnticipadaCount: data.salidaAnticipada,
        cierreAutomaticoCount: data.cierreAutomatico,
        ausentismoPct,
      });
    }

    return result.sort((a, b) => a.departamento.localeCompare(b.departamento));
  }

  // ── Heatmap de asistencia ────────────────────────────────────
  async getHeatmap(
    startDate: string,
    endDate: string,
    departamento?: string,
  ): Promise<{ grid: any[]; totalEmpleados: number; departamentos: string[] }> {
    const qb = this.usuarioRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.area', 'area')
      .where('u.is_active = 1');

    if (departamento) {
      qb.andWhere('area.departamento = :departamento', { departamento });
    }

    const usuarios = await qb.getMany();
    if (!usuarios.length) {
      return { grid: [], totalEmpleados: 0, departamentos: [] };
    }

    const idOdoos = usuarios.map((u) => u.id_odoo).filter(Boolean);

    // Lista de departamentos únicos para el filtro del frontend
    const departamentos = [
      ...new Set(
        usuarios.map((u) => u.area?.departamento).filter(Boolean) as string[],
      ),
    ].sort();

    const uid = await this.odoo.authenticate();
    const records = await this.odoo.executeKw<any[]>(
      'hr.attendance',
      'search_read',
      [[
        ['employee_id', 'in', idOdoos],
        ['check_in', '>=', `${startDate} 00:00:00`],
        ['check_in', '<=', `${endDate} 23:59:59`],
      ]],
      { fields: ['employee_id', 'check_in'], limit: 15000 },
      uid,
    );

    // Agregar por fecha → set de empleados presentes
    const dayMap = new Map<string, Set<number>>();

    const startD = new Date(startDate + 'T12:00:00');
    const endD = new Date(endDate + 'T12:00:00');
    for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
      dayMap.set(d.toISOString().split('T')[0], new Set());
    }

    for (const rec of records) {
      if (!rec.check_in) continue;
      const localDate = new Date(rec.check_in + ' UTC')
        .toLocaleString('en-CA', { timeZone: 'America/Bogota' })
        .split(',')[0]
        .trim();

      const empId: number = Array.isArray(rec.employee_id) ? rec.employee_id[0] : rec.employee_id;
      if (dayMap.has(localDate)) {
        dayMap.get(localDate)!.add(empId);
      }
    }

    const totalEmpleados = usuarios.length;
    const grid: any[] = [];

    for (const [fecha, empSet] of dayMap) {
      const d = new Date(fecha + 'T12:00:00');
      grid.push({
        fecha,
        diaSemana: d.getDay(),
        presentes: empSet.size,
        pct: totalEmpleados > 0 ? Math.round((empSet.size / totalEmpleados) * 100) : 0,
      });
    }

    return {
      grid: grid.sort((a, b) => a.fecha.localeCompare(b.fecha)),
      totalEmpleados,
      departamentos,
    };
  }
}
