import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PazSalvo } from './entities/paz-salvo.entity';
import { Novedad } from './entities/novedad.entity';

type Modulo = 'sst' | 'ch' | 'it';

interface CheckItem {
  key: string;
  label: string;
  ok: boolean;
  por: string | null;
  fecha: string | null;
  notas: string | null;
}

/** Ítems por defecto para cada módulo */
const DEFAULT_ITEMS: Record<Modulo, CheckItem[]> = {
  sst: [
    { key: 'epp',          label: 'Entrega de dotación y EPP',              ok: false, por: null, fecha: null, notas: null },
    { key: 'accidentes',   label: 'Paz y Salvo accidentes de trabajo',      ok: false, por: null, fecha: null, notas: null },
    { key: 'capacitacion', label: 'Certificado de capacitaciones al día',   ok: false, por: null, fecha: null, notas: null },
  ],
  ch: [
    { key: 'liquidacion',  label: 'Liquidación de nómina procesada',        ok: false, por: null, fecha: null, notas: null },
    { key: 'carta',        label: 'Carta de renuncia recibida y firmada',   ok: false, por: null, fecha: null, notas: null },
    { key: 'carne',        label: 'Devolución de carné',                    ok: false, por: null, fecha: null, notas: null },
    { key: 'paz_nomina',   label: 'Paz y Salvo de préstamos y descuentos',  ok: false, por: null, fecha: null, notas: null },
  ],
  it: [
    { key: 'equipo',       label: 'Devolución de equipo de cómputo',        ok: false, por: null, fecha: null, notas: null },
    { key: 'accesos',      label: 'Cierre de cuentas y accesos del sistema', ok: false, por: null, fecha: null, notas: null },
    { key: 'dispositivos', label: 'Devolución de dispositivos móviles',     ok: false, por: null, fecha: null, notas: null },
  ],
};

function parseItems(json: string | null, modulo: Modulo): CheckItem[] {
  if (!json) return DEFAULT_ITEMS[modulo].map(i => ({ ...i }));
  try { return JSON.parse(json); } catch { return DEFAULT_ITEMS[modulo].map(i => ({ ...i })); }
}

function allOk(items: CheckItem[]): boolean {
  return items.length > 0 && items.every(i => i.ok);
}

@Injectable()
export class PazSalvoService {
  constructor(
    @InjectRepository(PazSalvo)
    private readonly psRepo: Repository<PazSalvo>,
    @InjectRepository(Novedad)
    private readonly novRepo: Repository<Novedad>,
  ) {}

  /**
   * Busca novedades de tipo "Renuncia" aprobadas por el jefe.
   * Devuelve la novedad con el registro paz_salvo asociado (si existe).
   */
  async buscarRenuncias(filters: {
    cedula?: string;
    fechaInicio?: string;
    fechaFin?: string;
    company?: string;
  }) {
    // SQL Server no admite = en columnas tipo text → usar CAST para comparar
    // Usar nombre de columna DB (aprobado_jefe) en condiciones raw de TypeORM
    const qb = this.novRepo
      .createQueryBuilder('n')
      .where("CAST(n.tipificacion AS nvarchar(255)) = 'Renuncia'")
      .andWhere('n.aprobado_jefe = 1')
      .orderBy('n.fecha_inicio', 'DESC');

    if (filters.cedula)
      qb.andWhere('n.cedula LIKE :cedula', { cedula: `%${filters.cedula}%` });
    if (filters.fechaInicio)
      qb.andWhere('n.fecha_inicio >= :fi', { fi: filters.fechaInicio });
    if (filters.fechaFin)
      qb.andWhere('n.fecha_inicio <= :ff', { ff: filters.fechaFin });

    const novedades = await qb.getMany();
    if (!novedades.length) return [];

    // Obtener paz_salvo asociados
    const ids = novedades.map(n => n.id);
    const registros = await this.psRepo.find({
      where: ids.map(id => ({ novedad_id: id })),
    });
    const psMap = new Map(registros.map(r => [r.novedad_id, r]));

    return novedades.map(n => ({
      novedad: n,
      pazSalvo: psMap.get(n.id) ?? null,
    }));
  }

  /**
   * Obtiene (o crea) el registro paz_salvo para una novedad.
   */
  async obtenerOCrear(novedadId: number, por: string): Promise<PazSalvo> {
    const existe = await this.psRepo.findOne({ where: { novedad_id: novedadId } });
    if (existe) return existe;

    const novedad = await this.novRepo.findOne({ where: { id: novedadId } });
    if (!novedad) throw new Error('Novedad no encontrada');

    const nuevo = this.psRepo.create({
      novedad_id: novedadId,
      cedula:        novedad.cedula,
      nombre:        novedad.nombre,
      cargo:         (novedad as any).cargo ?? null,
      departamento:  (novedad as any).departamento ?? null,
      company:       (novedad as any).company ?? null,
      fecha_renuncia: novedad.fechaInicio ?? null,
      sst_ok: false, ch_ok: false, it_ok: false,
      proceso_completo: false,
    });
    return this.psRepo.save(nuevo);
  }

  /**
   * Actualiza el estado de un módulo del checklist.
   * Si los 3 módulos quedan en true → marca proceso_completo.
   */
  async actualizarModulo(
    id: number,
    modulo: Modulo,
    ok: boolean,
    notas: string,
    por: string,
  ): Promise<PazSalvo> {
    const reg = await this.psRepo.findOne({ where: { id } });
    if (!reg) throw new Error('Registro paz y salvo no encontrado');

    const ahora = new Date();
    if (modulo === 'sst') {
      reg.sst_ok    = ok;
      reg.sst_notas = notas ?? null;
      reg.sst_por   = ok ? por : null;
      reg.sst_fecha = ok ? ahora : null;
    } else if (modulo === 'ch') {
      reg.ch_ok    = ok;
      reg.ch_notas = notas ?? null;
      reg.ch_por   = ok ? por : null;
      reg.ch_fecha = ok ? ahora : null;
    } else {
      reg.it_ok    = ok;
      reg.it_notas = notas ?? null;
      reg.it_por   = ok ? por : null;
      reg.it_fecha = ok ? ahora : null;
    }

    // Verificar si todos los módulos están completos
    reg.proceso_completo = reg.sst_ok && reg.ch_ok && reg.it_ok;
    reg.fecha_completado = reg.proceso_completo ? ahora : null;

    return this.psRepo.save(reg);
  }

  /** Obtiene un registro por id */
  async obtenerPorId(id: number): Promise<PazSalvo | null> {
    return this.psRepo.findOne({ where: { id } });
  }

  /** Obtiene todos los registros en proceso (para dashboard) */
  async listarEnProceso(): Promise<PazSalvo[]> {
    return this.psRepo.find({
      where: { proceso_completo: false },
      order: { created_at: 'DESC' },
    });
  }
}
