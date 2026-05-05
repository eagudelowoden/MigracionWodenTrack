// src/novedades/novedades.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Novedad } from './entities/novedad.entity';
import { NovedadEstadoCh } from './entities/novedad-estado-ch.entity';
import { CreateNovedadDto } from './dto/create-novedad.dto';
import { SistemaConfigService } from '../sistema-config/sistema-config.service';

@Injectable()
export class NovedadesService {
  private readonly localDir: string;
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(
    @InjectRepository(Novedad)
    private readonly novedadRepo: Repository<Novedad>,
    @InjectRepository(NovedadEstadoCh)
    private readonly estadoChRepo: Repository<NovedadEstadoCh>,
    private readonly config: ConfigService,
    private readonly sistemaConfig: SistemaConfigService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {
    this.localDir = path.join(process.cwd(), 'uploads', 'novedades');
    this.bucket = this.config.get<string>('AWS_S3_BUCKET', '');

    this.s3 = new S3Client({
      region: this.config.get<string>('AWS_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: this.config.get<string>('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: this.config.get<string>('AWS_SECRET_ACCESS_KEY', ''),
      },
    });

    if (!fs.existsSync(this.localDir)) {
      fs.mkdirSync(this.localDir, { recursive: true });
    }
  }

  // ─── Guardar archivo ───────────────────────────────────────────────────────
  private async saveFile(file: Express.Multer.File, modo: string) {
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;

    if (modo === 's3' && !this.bucket) {
      throw new Error(
        'El modo de almacenamiento está configurado como S3 pero AWS_S3_BUCKET no está definido en las variables de entorno.',
      );
    }
    const modoEfectivo = modo;

    if (modoEfectivo === 's3') {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: `novedades/${uniqueName}`,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );
      return { storageKey: `novedades/${uniqueName}`, storageMode: 's3' };
    }

    // Local
    fs.writeFileSync(path.join(this.localDir, uniqueName), file.buffer);
    return { storageKey: uniqueName, storageMode: 'local' };
  }

  // ─── Resolver URL ──────────────────────────────────────────────────────────
  private async resolveUrl(
    storageKey: string,
    storageMode: string,
  ): Promise<string> {
    if (storageMode === 's3') {
      return getSignedUrl(
        this.s3,
        new GetObjectCommand({ Bucket: this.bucket, Key: storageKey }),
        { expiresIn: 3600 },
      );
    }
    // ← ruta relativa está bien, el frontend ya sabe usar /novedades/:id/file
    return `/uploads/novedades/${storageKey}`;
  }

  // ─── CREATE ────────────────────────────────────────────────────────────────
  async create(dto: CreateNovedadDto, file: Express.Multer.File) {
    if (!file) throw new Error('Se requiere un documento de soporte.');
    const storageFromDb = await this.sistemaConfig.get('storage_mode', 'local');
    const modoEfectivo = dto.storageMode || storageFromDb;
    const { storageKey, storageMode } = await this.saveFile(file, modoEfectivo);

    const novedad = this.novedadRepo.create({
      nombre: dto.nombre,
      cedula: dto.cedula,
      descripcion: dto.descripcion,
      tipificacion: dto.tipificacion,
      fechaInicio: dto.fechaInicio,
      fechaFin: dto.fechaFin,
      soporteNombreOriginal: file.originalname,
      soporteStorageKey: storageKey,
      soporteStorageMode: storageMode,
      soporteMime: file.mimetype,

      // ─── Responsable — convierte string a number ──────────
      responsableIdOdoo: dto.responsableIdOdoo
        ? Number(dto.responsableIdOdoo)
        : null,
      responsableNombre: dto.responsableNombre || null,
      responsableCargo: dto.responsableCargo || null,
      creadoPor: dto.creadoPor ? Number(dto.creadoPor) : undefined,
    });

    const saved = await this.novedadRepo.save(novedad);

    return {
      success: true,
      message: 'Novedad registrada exitosamente.',
      data: { id: saved.id, storageMode },
    };
  }

  // ─── FIND ALL ──────────────────────────────────────────────────────────────
  async findAll() {
    const novedades = await this.novedadRepo.find({ order: { createdAt: 'DESC' } });
    if (!novedades.length) return [];

    // Enriquecer con departamento y cargo desde usuarios_registrados
    const nombres = [...new Set(novedades.map((n) => n.nombre).filter(Boolean))];
    const escapedNames = nombres
      .map((n) => `'${n.replace(/'/g, "''")}'`)
      .join(', ');

    const usuarios: Array<{ nombre: string; departamento: string; cargo: string }> =
      await this.dataSource.query(
        `SELECT nombre, departamento, cargo FROM usuarios_registrados WHERE nombre IN (${escapedNames})`,
      );

    const usuarioMap = new Map(usuarios.map((u) => [u.nombre, u]));

    return novedades.map((n) => ({
      ...n,
      departamento: usuarioMap.get(n.nombre)?.departamento ?? null,
      cargo: usuarioMap.get(n.nombre)?.cargo ?? null,
    }));
  }

  // ─── Helper: novedades de un conjunto de cédulas ─────────────────────────
  private async novedadesPorCedulas(
    empleados: Array<{ cedula: string; nombre: string; departamento: string; cargo: string }>,
  ) {
    if (!empleados.length) return [];

    const cedulas = [
      ...new Set(empleados.map((e) => e.cedula).filter(Boolean)),
    ];
    if (!cedulas.length) return [];

    const escaped = cedulas
      .map((c) => `'${String(c).replace(/'/g, "''")}'`)
      .join(', ');

    const novedades = await this.novedadRepo
      .createQueryBuilder('n')
      .where(`n.cedula IN (${escaped})`)
      .orderBy('n.createdAt', 'DESC')
      .getMany();

    const empMap = new Map(empleados.map((e) => [e.cedula, e]));
    return novedades.map((n) => ({
      ...n,
      departamento: empMap.get(n.cedula)?.departamento ?? null,
      cargo: empMap.get(n.cedula)?.cargo ?? null,
    }));
  }

  // ─── ÁREA: solo empleados cuyo area_id pertenece a este responsable ───────
  async findPorAreaResponsable(idOdoo: number) {
    const empleados: Array<{ cedula: string; nombre: string; departamento: string; cargo: string }> =
      await this.dataSource.query(`
        SELECT u.identificacion AS cedula, u.nombre, u.departamento, u.cargo
        FROM   usuarios_registrados u
        INNER  JOIN maestro_areas a    ON u.area_id = a.id
        INNER  JOIN usuarios_registrados r ON a.responsable_id = r.id
        WHERE  r.id_odoo = ${idOdoo}
          AND  u.identificacion IS NOT NULL
      `);
    return this.novedadesPorCedulas(empleados);
  }

  // ─── SEGMENTO: TODOS los empleados del segmento, sin importar area_id ────
  async findPorSegmentoResponsable(idOdoo: number) {
    const empleados: Array<{ cedula: string; nombre: string; departamento: string; cargo: string }> =
      await this.dataSource.query(`
        SELECT u.identificacion AS cedula, u.nombre, u.departamento, u.cargo
        FROM   usuarios_registrados u
        INNER  JOIN maestro_segmentos s ON u.segmento_id = s.id
        INNER  JOIN usuarios_registrados r ON s.responsable_id = r.id
        WHERE  r.id_odoo = ${idOdoo}
          AND  u.identificacion IS NOT NULL
      `);
    return this.novedadesPorCedulas(empleados);
  }

  // ─── DEPARTAMENTO: todos en los deptos del director ───────────────────────
  async findPorDepartamentos(departamentos: string[]) {
    if (!departamentos.length) return [];

    const escapedDeptos = departamentos
      .map((d) => `'${d.replace(/'/g, "''")}'`)
      .join(', ');

    const empleados: Array<{ cedula: string; nombre: string; departamento: string; cargo: string }> =
      await this.dataSource.query(`
        SELECT identificacion AS cedula, nombre, departamento, cargo
        FROM   usuarios_registrados
        WHERE  departamento IN (${escapedDeptos})
          AND  identificacion IS NOT NULL
      `);

    return this.novedadesPorCedulas(empleados);
  }

  // ─── FIND MIS NOVEDADES (historial del usuario) ───────────────────────────
  async findMias(
    idOdoo: number,
    fechaDesde?: string,
    fechaHasta?: string,
    buscar?: string,
  ) {
    const qb = this.novedadRepo
      .createQueryBuilder('n')
      .where('n.creadoPor = :idOdoo', { idOdoo })
      .orderBy('n.createdAt', 'DESC');

    if (fechaDesde) qb.andWhere('n.fechaInicio >= :fechaDesde', { fechaDesde });
    if (fechaHasta) qb.andWhere('n.fechaInicio <= :fechaHasta', { fechaHasta });
    if (buscar) {
      const like = `%${buscar}%`;
      qb.andWhere(
        '(n.descripcion LIKE :like OR n.tipificacion LIKE :like OR n.nombre LIKE :like)',
        { like },
      );
    }

    return qb.getMany();
  }

  // ─── FIND ONE ──────────────────────────────────────────────────────────────
  async findOne(id: number) {
    const novedad = await this.novedadRepo.findOneBy({ id });
    if (!novedad) throw new NotFoundException('Novedad no encontrada.');

    const fileUrl = await this.resolveUrl(
      novedad.soporteStorageKey,
      novedad.soporteStorageMode,
    );
    return { ...novedad, fileUrl };
  }

  // ─── STREAM FILE ──────────────────────────────────────────────────────────
  async streamFile(id: number, res: Response) {
    const novedad = await this.novedadRepo.findOneBy({ id });
    if (!novedad) throw new NotFoundException('Novedad no encontrada.');

    if (novedad.soporteStorageMode === 's3') {
      const url = await this.resolveUrl(novedad.soporteStorageKey, 's3');
      return res.redirect(302, url);
    }

    const filePath = path.join(this.localDir, novedad.soporteStorageKey);
    if (!fs.existsSync(filePath))
      throw new NotFoundException('Archivo no encontrado en disco.');

    res.setHeader(
      'Content-Type',
      novedad.soporteMime || 'application/octet-stream',
    );
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(novedad.soporteNombreOriginal)}"`,
    );
    fs.createReadStream(filePath).pipe(res);
  }

  // ─── DELETE (soft delete + auditoría) ────────────────────────────────────
  async remove(
    id: number,
    eliminadoPor?: number,
    eliminadoPorNombre?: string,
  ) {
    const novedad = await this.novedadRepo.findOneBy({ id });
    if (!novedad) throw new NotFoundException('Novedad no encontrada.');

    // Borrar archivo físico
    if (novedad.soporteStorageMode === 'local') {
      const filePath = path.join(this.localDir, novedad.soporteStorageKey);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } else if (this.bucket) {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: novedad.soporteStorageKey,
        }),
      );
    }

    // Guardar auditoría antes de soft-delete
    novedad.eliminadoPor = eliminadoPor ?? null;
    novedad.eliminadoPorNombre = eliminadoPorNombre ?? null;
    await this.novedadRepo.save(novedad);

    // Soft delete: marca deleted_at, el registro queda en BD
    await this.novedadRepo.softDelete(id);
    return { success: true, message: 'Novedad eliminada.' };
  }
  async aprobarJefe(id: number, aprobado: number, motivo: string) {
    const novedad = await this.novedadRepo.findOne({ where: { id } });
    if (!novedad) throw new Error('Novedad no encontrada');

    novedad.aprobadoJefe = aprobado;
    novedad.motivoJefe = motivo;
    novedad.fechaAprobacionJefe = new Date();

    this.actualizarEstadoGeneral(novedad);
    return await this.novedadRepo.save(novedad);
  }

  async aprobarRrhh(id: number, aprobado: number, motivo: string) {
    const novedad = await this.novedadRepo.findOne({ where: { id } });
    if (!novedad) throw new Error('Novedad no encontrada');

    novedad.aprobadoRrhh = aprobado;
    novedad.motivoRrhh = motivo;
    novedad.fechaAprobacionRrhh = new Date();

    this.actualizarEstadoGeneral(novedad);
    return await this.novedadRepo.save(novedad);
  }

  private actualizarEstadoGeneral(novedad: Novedad) {
    if (novedad.aprobadoJefe === 0 || novedad.aprobadoRrhh === 0) {
      novedad.aprobado = 0; // rechazado por cualquiera
    } else if (novedad.aprobadoJefe === 1 && novedad.aprobadoRrhh === 1) {
      novedad.aprobado = 1; // aprobado por ambos
    } else {
      novedad.aprobado = null; // aún pendiente
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // ESTADOS PERSONALIZADOS — CAPITAL HUMANO
  // ══════════════════════════════════════════════════════════════════

  /** Devuelve todos los estados CH ordenados */
  async findEstadosCh(): Promise<NovedadEstadoCh[]> {
    return this.estadoChRepo.find({ order: { orden: 'ASC', createdAt: 'ASC' } });
  }

  /** Crea un nuevo estado CH */
  async crearEstadoCh(
    nombre: string,
    icono: string,
    color: string,
  ): Promise<NovedadEstadoCh> {
    const existe = await this.estadoChRepo.findOneBy({ nombre });
    if (existe) throw new ConflictException(`El estado "${nombre}" ya existe.`);
    const totalActual = await this.estadoChRepo.count();
    const estado = this.estadoChRepo.create({
      nombre,
      icono: icono || 'fas fa-folder',
      color: color || '#6b7280',
      orden: totalActual,
    });
    return this.estadoChRepo.save(estado);
  }

  /** Elimina un estado CH */
  async eliminarEstadoCh(id: number): Promise<{ success: boolean }> {
    const estado = await this.estadoChRepo.findOneBy({ id });
    if (!estado) throw new NotFoundException('Estado no encontrado.');
    // Limpiar ese estado en novedades que lo tengan asignado
    await this.novedadRepo
      .createQueryBuilder()
      .update(Novedad)
      .set({ estadoCh: null })
      .where('estado_ch = :nombre', { nombre: estado.nombre })
      .execute();
    await this.estadoChRepo.remove(estado);
    return { success: true };
  }

  /** Asigna (o limpia) el estado CH en una novedad */
  async cambiarEstadoCh(
    novedadId: number,
    estadoCh: string | null,
  ): Promise<Novedad> {
    const novedad = await this.novedadRepo.findOneBy({ id: novedadId });
    if (!novedad) throw new NotFoundException('Novedad no encontrada.');
    novedad.estadoCh = estadoCh ?? null;
    return this.novedadRepo.save(novedad);
  }
}
