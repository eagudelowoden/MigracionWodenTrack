import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { MallaAsignacion } from '../mallas/entities/malla-asignacion.entity';
import { OdooService } from '../odoo/odoo.service';

@Injectable()
export class SuperAdminIAService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(MallaAsignacion)
    private readonly asignacionRepo: Repository<MallaAsignacion>,
    private readonly odoo: OdooService,
  ) {}

  // ── Score de riesgo + patrones por empleado ──────────────────
  async getScoresRiesgo(): Promise<any[]> {
    const hoy = new Date();
    const hace30 = new Date(hoy); hace30.setDate(hoy.getDate() - 30);
    const startDate = hace30.toISOString().split('T')[0];
    const endDate   = hoy.toISOString().split('T')[0];

    const usuarios = await this.usuarioRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.area', 'area')
      .where('u.is_active = 1')
      .getMany();

    if (!usuarios.length) return [];

    // Empleados con malla activa
    const conMalla = await this.asignacionRepo
      .createQueryBuilder('a').select('a.usuario_id_odoo')
      .where('a.actual = 1').getRawMany();
    const conMallaSet = new Set(conMalla.map(r => r['a_usuario_id_odoo']));

    const idOdoos = usuarios.map(u => u.id_odoo).filter(Boolean);

    const uid = await this.odoo.authenticate();
    const records = await this.odoo.executeKw<any[]>(
      'hr.attendance', 'search_read',
      [[['employee_id', 'in', idOdoos],
        ['check_in', '>=', `${startDate} 00:00:00`],
        ['check_in', '<=', `${endDate} 23:59:59`]]],
      { fields: ['employee_id', 'check_in', 'x_studio_tipo_entrada'], limit: 20000 },
      uid,
    );

    // Agregar por empleado
    type EmpData = { entradas: number; aTiempo: number; tarde: number; diasSet: Set<string>; lunes: number; totalLunes: number };
    const empMap = new Map<number, EmpData>();
    for (const u of usuarios) {
      empMap.set(u.id_odoo, { entradas: 0, aTiempo: 0, tarde: 0, diasSet: new Set(), lunes: 0, totalLunes: 0 });
    }

    for (const rec of records) {
      const empId: number = Array.isArray(rec.employee_id) ? rec.employee_id[0] : rec.employee_id;
      const data = empMap.get(empId);
      if (!data || !rec.check_in) continue;

      const localDate = new Date(rec.check_in + ' UTC')
        .toLocaleString('en-CA', { timeZone: 'America/Bogota' }).split(',')[0].trim();
      const diaSemana = new Date(localDate + 'T12:00:00').getDay();

      data.entradas++;
      data.diasSet.add(localDate);
      if (rec.x_studio_tipo_entrada === 'A TIEMPO') data.aTiempo++;
      if (rec.x_studio_tipo_entrada === 'ENTRADA TARDE') data.tarde++;
      if (diaSemana === 1) data.lunes++; // presencia el lunes
    }

    // Contar cuántos lunes hay en el rango
    const lunesEnRango = this.contarDiaSemana(startDate, endDate, 1);
    const diasLaboralesEnRango = Math.ceil(30 * 5 / 7);

    return usuarios.map(u => {
      const data = empMap.get(u.id_odoo) || { entradas: 0, aTiempo: 0, tarde: 0, diasSet: new Set(), lunes: 0 };
      const tieneMalla   = conMallaSet.has(u.id_odoo);
      const diasPresente = data.diasSet.size;
      const tasaAsist    = diasPresente / diasLaboralesEnRango;
      const tasaPuntual  = data.entradas > 0 ? data.aTiempo / data.entradas : 1;
      const tasaLunes    = lunesEnRango > 0 ? data.lunes / lunesEnRango : 1;
      const promedioOtros = diasPresente > 0 ? diasPresente / diasLaboralesEnRango : 0;

      // Score de riesgo (0-100, mayor = más riesgo)
      let score = 0;
      if (!tieneMalla)         score += 30;
      if (tasaAsist < 0.6)     score += 25;
      else if (tasaAsist < 0.8) score += 12;
      if (tasaPuntual < 0.5)   score += 20;
      else if (tasaPuntual < 0.7) score += 10;
      if (tasaLunes < 0.5 && lunesEnRango >= 3) score += 10;
      if (data.entradas === 0) score = Math.max(score, 50);

      const patrones: string[] = [];
      if (!tieneMalla) patrones.push('Sin malla asignada');
      if (tasaPuntual < 0.5 && data.entradas >= 5) patrones.push('Alta tardanza');
      if (tasaLunes < 0.5 && lunesEnRango >= 3) patrones.push('Ausentismo los lunes');
      if (data.entradas === 0) patrones.push('Sin marcaciones en 30 días');

      return {
        id_odoo:    u.id_odoo,
        nombre:     u.nombre,
        cargo:      u.cargo || '—',
        area:       u.area?.nombre || 'Sin área',
        departamento: u.area?.departamento || '—',
        score:      Math.min(100, score),
        nivel:      score >= 60 ? 'alto' : score >= 30 ? 'medio' : 'bajo',
        marcaciones: data.entradas,
        puntualidadPct: Math.round(tasaPuntual * 100),
        asistenciaPct: Math.round(tasaAsist * 100),
        patrones,
      };
    }).sort((a, b) => b.score - a.score);
  }

  // ── Tendencias 12 meses ─────────────────────────────────────
  async getTendencias12Meses(): Promise<any[]> {
    const hoy   = new Date();
    const hace12 = new Date(hoy); hace12.setMonth(hoy.getMonth() - 11); hace12.setDate(1);
    const startDate = hace12.toISOString().split('T')[0];
    const endDate   = hoy.toISOString().split('T')[0];

    const usuarios = await this.usuarioRepo
      .createQueryBuilder('u').leftJoinAndSelect('u.area', 'area')
      .where('u.is_active = 1').getMany();

    if (!usuarios.length) return [];

    const idOdoos = usuarios.map(u => u.id_odoo).filter(Boolean);
    const userDeptMap = new Map<number, string>();
    for (const u of usuarios) {
      userDeptMap.set(u.id_odoo, u.area?.departamento || 'Sin departamento');
    }

    const uid = await this.odoo.authenticate();
    const records = await this.odoo.executeKw<any[]>(
      'hr.attendance', 'search_read',
      [[['employee_id', 'in', idOdoos],
        ['check_in', '>=', `${startDate} 00:00:00`],
        ['check_in', '<=', `${endDate} 23:59:59`]]],
      { fields: ['employee_id', 'check_in', 'x_studio_tipo_entrada'], limit: 50000 },
      uid,
    );

    // mes-depto → { entradas, aTiempo }
    type MesData = { entradas: number; aTiempo: number; empSet: Set<number> };
    const mesMap = new Map<string, MesData>();

    for (const rec of records) {
      if (!rec.check_in) continue;
      const empId: number = Array.isArray(rec.employee_id) ? rec.employee_id[0] : rec.employee_id;
      const localDate = new Date(rec.check_in + ' UTC')
        .toLocaleString('en-CA', { timeZone: 'America/Bogota' }).split(',')[0].trim();
      const mes = localDate.substring(0, 7); // YYYY-MM
      const depto = userDeptMap.get(empId) || 'Sin departamento';
      const key = `${mes}|${depto}`;

      if (!mesMap.has(key)) mesMap.set(key, { entradas: 0, aTiempo: 0, empSet: new Set() });
      const d = mesMap.get(key)!;
      d.entradas++;
      d.empSet.add(empId);
      if (rec.x_studio_tipo_entrada === 'A TIEMPO') d.aTiempo++;
    }

    // Empleados por depto
    const deptEmpCount = new Map<string, number>();
    for (const u of usuarios) {
      const d = u.area?.departamento || 'Sin departamento';
      deptEmpCount.set(d, (deptEmpCount.get(d) || 0) + 1);
    }

    const result: any[] = [];
    for (const [key, data] of mesMap) {
      const [mes, departamento] = key.split('|');
      const totalEmp = deptEmpCount.get(departamento) || 1;
      const diasEnMes = 22; // aprox días laborales
      const totalEsperado = totalEmp * diasEnMes;
      result.push({
        mes,
        departamento,
        puntualidadPct: data.entradas > 0 ? Math.round((data.aTiempo / data.entradas) * 100) : 0,
        ausentismoPct:  Math.min(100, Math.max(0, Math.round(((totalEsperado - data.entradas) / totalEsperado) * 100))),
        marcaciones:    data.entradas,
      });
    }

    return result.sort((a, b) => a.mes.localeCompare(b.mes) || a.departamento.localeCompare(b.departamento));
  }

  // ── Ranking del mes ─────────────────────────────────────────
  async getRankingMes(): Promise<{ mejores: any[]; peores: any[] }> {
    const hoy   = new Date();
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const startDate = inicio.toISOString().split('T')[0];
    const endDate   = hoy.toISOString().split('T')[0];

    const usuarios = await this.usuarioRepo
      .createQueryBuilder('u').leftJoinAndSelect('u.area', 'area')
      .where('u.is_active = 1').getMany();

    if (!usuarios.length) return { mejores: [], peores: [] };

    const idOdoos = usuarios.map(u => u.id_odoo).filter(Boolean);
    const uid = await this.odoo.authenticate();

    const records = await this.odoo.executeKw<any[]>(
      'hr.attendance', 'search_read',
      [[['employee_id', 'in', idOdoos],
        ['check_in', '>=', `${startDate} 00:00:00`],
        ['check_in', '<=', `${endDate} 23:59:59`]]],
      { fields: ['employee_id', 'check_in', 'x_studio_tipo_entrada'], limit: 10000 },
      uid,
    );

    type DeptData = { empSet: Set<number>; entradas: number; aTiempo: number; departamento: string };
    const deptMap = new Map<string, DeptData>();

    for (const u of usuarios) {
      const area = u.area?.nombre || 'Sin área';
      if (!deptMap.has(area)) {
        deptMap.set(area, { empSet: new Set(), entradas: 0, aTiempo: 0, departamento: u.area?.departamento || '—' });
      }
      deptMap.get(area)!.empSet.add(u.id_odoo);
    }

    const userAreaMap = new Map<number, string>();
    for (const u of usuarios) userAreaMap.set(u.id_odoo, u.area?.nombre || 'Sin área');

    for (const rec of records) {
      const empId: number = Array.isArray(rec.employee_id) ? rec.employee_id[0] : rec.employee_id;
      const area = userAreaMap.get(empId);
      if (!area) continue;
      const d = deptMap.get(area);
      if (!d) continue;
      d.entradas++;
      if (rec.x_studio_tipo_entrada === 'A TIEMPO') d.aTiempo++;
    }

    const diasMes = hoy.getDate();
    const ranking = Array.from(deptMap.entries()).map(([area, d]) => {
      const totalEmp = d.empSet.size;
      const totalEsperado = totalEmp * Math.ceil(diasMes * 5 / 7);
      const asistenciaPct = totalEsperado > 0 ? Math.min(100, Math.round((d.entradas / totalEsperado) * 100)) : 0;
      const puntualidadPct = d.entradas > 0 ? Math.round((d.aTiempo / d.entradas) * 100) : 0;
      const score = Math.round((asistenciaPct * 0.6) + (puntualidadPct * 0.4));
      return { area, departamento: d.departamento, totalEmpleados: totalEmp, asistenciaPct, puntualidadPct, score };
    }).sort((a, b) => b.score - a.score);

    return {
      mejores: ranking.slice(0, 3),
      peores:  ranking.slice(-3).reverse(),
    };
  }

  // ── Helper ───────────────────────────────────────────────────
  private contarDiaSemana(start: string, end: string, dia: number): number {
    let count = 0;
    const d = new Date(start + 'T12:00:00');
    const e = new Date(end + 'T12:00:00');
    while (d <= e) { if (d.getDay() === dia) count++; d.setDate(d.getDate() + 1); }
    return count;
  }
}
