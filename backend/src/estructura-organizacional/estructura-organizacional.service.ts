import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CentroCosto } from './entities/centro-costo.entity';
import { SegmentoEstructura } from './entities/segmento-estructura.entity';
import { SegmentacionArea } from './entities/segmentacion-area.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';

@Injectable()
export class EstructuraOrganizacionalService {
  constructor(
    @InjectRepository(CentroCosto)
    private readonly centroCostoRepo: Repository<CentroCosto>,
    @InjectRepository(SegmentoEstructura)
    private readonly segmentoRepo: Repository<SegmentoEstructura>,
    @InjectRepository(SegmentacionArea)
    private readonly segmentacionRepo: Repository<SegmentacionArea>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
  ) {}

  // ── Segmentos (maestro propio, distinto del de "Organización") ─────────────

  async listarSegmentos(): Promise<SegmentoEstructura[]> {
    return this.segmentoRepo.find({ order: { nombre: 'ASC' } });
  }

  async crearSegmento(data: { nombre: string; creadoPor?: string }): Promise<SegmentoEstructura> {
    const nuevo = this.segmentoRepo.create({
      nombre: data.nombre.trim(),
      creado_por: data.creadoPor ?? null,
    });
    return this.segmentoRepo.save(nuevo);
  }

  /**
   * Antes de borrar, revisa si alguien lo tiene asignado (FK en
   * segmentacion_areas) — si no, el DELETE fallaría feo con un error de
   * constraint de SQL Server. Con gente asignada, se bloquea con un mensaje
   * claro: hay que reasignar a esas personas antes de poder borrarlo.
   */
  async eliminarSegmento(id: number): Promise<void> {
    const enUso = await this.segmentacionRepo.count({ where: { segmento_id: id } });
    if (enUso > 0) {
      throw new BadRequestException(
        `No se puede eliminar: ${enUso} persona(s) tienen este segmento asignado. Reasígnalas primero.`,
      );
    }
    const res = await this.segmentoRepo.delete({ id });
    if (!res.affected) throw new NotFoundException(`Segmento con id ${id} no encontrado`);
  }

  // ── Centros de costo (maestro) ──────────────────────────────────────────────

  async listarCentrosCosto(): Promise<CentroCosto[]> {
    return this.centroCostoRepo.find({ order: { nombre: 'ASC' } });
  }

  async crearCentroCosto(data: { nombre: string; codigo?: string; creadoPor?: string }): Promise<CentroCosto> {
    const nuevo = this.centroCostoRepo.create({
      nombre: data.nombre.trim(),
      codigo: data.codigo?.trim() || null,
      creado_por: data.creadoPor ?? null,
    });
    return this.centroCostoRepo.save(nuevo);
  }

  async eliminarCentroCosto(id: number): Promise<void> {
    const enUso = await this.segmentacionRepo.count({ where: { centro_costo_id: id } });
    if (enUso > 0) {
      throw new BadRequestException(
        `No se puede eliminar: ${enUso} persona(s) tienen este centro de costo asignado. Reasígnalas primero.`,
      );
    }
    const res = await this.centroCostoRepo.delete({ id });
    if (!res.affected) throw new NotFoundException(`Centro de costo con id ${id} no encontrado`);
  }

  // ── Asignaciones (segmento + centro de costo por persona) ──────────────────

  /**
   * Listado paginado de usuarios activos con su asignación vigente (si tiene).
   * LEFT JOIN a segmentacion_areas: quien no tiene fila ahí sale con segmento/
   * centro de costo en null, no se excluye.
   */
  async listarAsignaciones(opts: {
    search?: string;
    pais?: string;
    page?: number;
    limit?: number;
  }): Promise<{ total: number; page: number; limit: number; filas: any[] }> {
    const page = opts.page && opts.page > 0 ? opts.page : 1;
    const limit = opts.limit && opts.limit > 0 ? Math.min(opts.limit, 200) : 30;

    const qb = this.usuarioRepo
      .createQueryBuilder('u')
      .leftJoin('segmentacion_areas', 'sa', 'sa.usuario_id_odoo = u.id_odoo')
      .leftJoin('maestro_segmentos_estructura', 's', 's.id = sa.segmento_id')
      .leftJoin('maestro_centros_costo', 'cc', 'cc.id = sa.centro_costo_id')
      .where('u.is_active = :activo', { activo: true });

    if (opts.pais) qb.andWhere('u.pais = :pais', { pais: opts.pais });
    if (opts.search) {
      qb.andWhere('(u.nombre LIKE :s OR u.identificacion LIKE :s)', { s: `%${opts.search}%` });
    }

    const total = await qb.getCount();

    const filas = await qb
      .select('u.id_odoo', 'id_odoo')
      .addSelect('u.nombre', 'nombre')
      .addSelect('u.identificacion', 'identificacion')
      .addSelect('u.departamento', 'departamento')
      .addSelect('u.pais', 'pais')
      .addSelect('sa.segmento_id', 'segmento_id')
      .addSelect('s.nombre', 'segmento_nombre')
      .addSelect('sa.centro_costo_id', 'centro_costo_id')
      .addSelect('cc.nombre', 'centro_costo_nombre')
      .orderBy('u.nombre', 'ASC')
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany();

    return { total, page, limit, filas };
  }

  /** Crea o actualiza (upsert) la asignación vigente de una persona. */
  async asignar(
    idOdoo: number,
    data: { segmento_id?: number | null; centro_costo_id?: number | null; adminName?: string },
  ): Promise<SegmentacionArea> {
    const usuario = await this.usuarioRepo.findOne({ where: { id_odoo: idOdoo } });
    if (!usuario) throw new NotFoundException(`Usuario con id_odoo ${idOdoo} no encontrado`);

    let fila = await this.segmentacionRepo.findOne({ where: { usuario_id_odoo: idOdoo } });
    if (!fila) fila = this.segmentacionRepo.create({ usuario_id_odoo: idOdoo });

    if (data.segmento_id !== undefined) fila.segmento_id = data.segmento_id;
    if (data.centro_costo_id !== undefined) fila.centro_costo_id = data.centro_costo_id;
    if (data.adminName) fila.asignado_por = data.adminName;

    return this.segmentacionRepo.save(fila);
  }

  // ── Consumido por el cron de resumen de asistencia ──────────────────────────

  /**
   * Segmentación (segmento + centro de costo) de todos los usuarios activos
   * con asignación en segmentacion_areas, para cruzar el resumen diario de
   * asistencia. Dos mapas porque no todas las filas del resumen tienen
   * id_odoo disponible (ver AsistenciaResumenService): id_odoo es la cruce
   * primaria, cédula queda como respaldo.
   */
  async obtenerSegmentacionParaCron(): Promise<{
    porIdOdoo: Map<number, { segmento_id: number | null; segmento_nombre: string | null; centro_costo_id: number | null; centro_costo_nombre: string | null }>;
    porCedula: Map<string, { segmento_id: number | null; segmento_nombre: string | null; centro_costo_id: number | null; centro_costo_nombre: string | null }>;
  }> {
    const filas = await this.segmentacionRepo
      .createQueryBuilder('sa')
      .innerJoin('usuarios_registrados', 'u', 'u.id_odoo = sa.usuario_id_odoo')
      .leftJoin('maestro_segmentos_estructura', 's', 's.id = sa.segmento_id')
      .leftJoin('maestro_centros_costo', 'cc', 'cc.id = sa.centro_costo_id')
      .select('sa.usuario_id_odoo', 'id_odoo')
      .addSelect('u.identificacion', 'identificacion')
      .addSelect('sa.segmento_id', 'segmento_id')
      .addSelect('s.nombre', 'segmento_nombre')
      .addSelect('sa.centro_costo_id', 'centro_costo_id')
      .addSelect('cc.nombre', 'centro_costo_nombre')
      .getRawMany();

    const porIdOdoo = new Map<number, any>();
    const porCedula = new Map<string, any>();
    for (const f of filas) {
      const info = {
        segmento_id: f.segmento_id,
        segmento_nombre: f.segmento_nombre,
        centro_costo_id: f.centro_costo_id,
        centro_costo_nombre: f.centro_costo_nombre,
      };
      porIdOdoo.set(f.id_odoo, info);
      if (f.identificacion) porCedula.set(f.identificacion, info);
    }
    return { porIdOdoo, porCedula };
  }
}
