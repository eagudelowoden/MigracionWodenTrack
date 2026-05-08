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
import { NovedadArchivo } from './entities/novedad-archivo.entity';
import { CreateNovedadDto } from './dto/create-novedad.dto';
import { SistemaConfigService } from '../sistema-config/sistema-config.service';

@Injectable()
export class NovedadesService {
  private readonly localDir: string;
  private readonly s3: S3Client;
  private readonly bucket: string;

  // MIME types permitidos: solo PDF e imágenes
  private readonly ALLOWED_MIMES = new Set([
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ]);

  constructor(
    @InjectRepository(Novedad)
    private readonly novedadRepo: Repository<Novedad>,
    @InjectRepository(NovedadEstadoCh)
    private readonly estadoChRepo: Repository<NovedadEstadoCh>,
    @InjectRepository(NovedadArchivo)
    private readonly archivoRepo: Repository<NovedadArchivo>,
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

  // ─── Validar archivo (solo PDF e imágenes) ────────────────────────────────
  private validateFileType(file: Express.Multer.File): void {
    if (!this.ALLOWED_MIMES.has(file.mimetype)) {
      throw new Error(
        `Tipo de archivo no permitido: ${file.originalname}. Solo se aceptan PDF e imágenes (JPG, PNG, GIF, WEBP).`,
      );
    }
  }

  // ─── CREATE ────────────────────────────────────────────────────────────────
  async create(dto: CreateNovedadDto, files: Express.Multer.File[]) {
    const storageFromDb = await this.sistemaConfig.get('storage_mode', 'local');
    const modoEfectivo = dto.storageMode || storageFromDb;

    // Validar tipos antes de guardar
    for (const f of files) this.validateFileType(f);

    const novedad = this.novedadRepo.create({
      nombre: dto.nombre,
      cedula: dto.cedula,
      descripcion: dto.descripcion,
      tipificacion: dto.tipificacion,
      fechaInicio: dto.fechaInicio,
      fechaFin: dto.fechaFin,
      responsableIdOdoo: dto.responsableIdOdoo ? Number(dto.responsableIdOdoo) : null,
      responsableNombre: dto.responsableNombre || null,
      responsableCargo: dto.responsableCargo || null,
      creadoPor: dto.creadoPor ? Number(dto.creadoPor) : undefined,
    });

    const saved = await this.novedadRepo.save(novedad);

    // Guardar archivos adjuntos en novedad_archivos
    if (files.length) {
      await this.saveArchivos(saved.id, files, modoEfectivo);
    }

    return {
      success: true,
      message: 'Novedad registrada exitosamente.',
      data: { id: saved.id, storageMode: modoEfectivo, archivos: files.length },
    };
  }

  // ─── AGREGAR ARCHIVOS A NOVEDAD EXISTENTE ─────────────────────────────────
  async addArchivos(novedadId: number, files: Express.Multer.File[]) {
    const novedad = await this.novedadRepo.findOneBy({ id: novedadId });
    if (!novedad) throw new NotFoundException('Novedad no encontrada.');

    for (const f of files) this.validateFileType(f);

    const storageFromDb = await this.sistemaConfig.get('storage_mode', 'local');
    const archivos = await this.saveArchivos(novedadId, files, storageFromDb);
    return { success: true, archivos };
  }

  private async saveArchivos(
    novedadId: number,
    files: Express.Multer.File[],
    modo: string,
  ): Promise<NovedadArchivo[]> {
    const result: NovedadArchivo[] = [];
    for (const file of files) {
      const { storageKey, storageMode } = await this.saveFile(file, modo);
      const archivo = this.archivoRepo.create({
        novedadId,
        nombreOriginal: file.originalname,
        storageKey,
        storageMode,
        mime: file.mimetype,
        tamano: file.size,
      });
      result.push(await this.archivoRepo.save(archivo));
    }
    return result;
  }

  // ─── LISTAR ARCHIVOS DE UNA NOVEDAD ───────────────────────────────────────
  async getArchivos(novedadId: number) {
    const novedad = await this.novedadRepo.findOneBy({ id: novedadId });
    if (!novedad) throw new NotFoundException('Novedad no encontrada.');

    const archivos = await this.archivoRepo.find({
      where: { novedadId },
      order: { createdAt: 'ASC' },
    });

    return archivos.map((a) => ({
      id: a.id,
      nombreOriginal: a.nombreOriginal,
      mime: a.mime,
      tamano: a.tamano,
      createdAt: a.createdAt,
      url: `/usuarios/novedades/${novedadId}/archivos/${a.id}/file`,
    }));
  }

  // ─── STREAM / REDIRECT ARCHIVO ────────────────────────────────────────────
  async streamArchivo(novedadId: number, archivoId: number, res: Response) {
    const archivo = await this.archivoRepo.findOne({
      where: { id: archivoId, novedadId },
    });
    if (!archivo) throw new NotFoundException('Archivo no encontrado.');

    if (archivo.storageMode === 's3') {
      const url = await this.resolveUrl(archivo.storageKey, 's3');
      return res.redirect(302, url);
    }

    const filePath = path.join(this.localDir, archivo.storageKey);
    if (!fs.existsSync(filePath))
      throw new NotFoundException('Archivo no encontrado en disco.');

    res.setHeader('Content-Type', archivo.mime || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(archivo.nombreOriginal)}"`,
    );
    fs.createReadStream(filePath).pipe(res);
  }

  // ─── ELIMINAR ARCHIVO ─────────────────────────────────────────────────────
  async removeArchivo(novedadId: number, archivoId: number) {
    const archivo = await this.archivoRepo.findOne({
      where: { id: archivoId, novedadId },
    });
    if (!archivo) throw new NotFoundException('Archivo no encontrado.');

    // Borrar físico
    if (archivo.storageMode === 'local') {
      const filePath = path.join(this.localDir, archivo.storageKey);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } else if (this.bucket) {
      await this.s3.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: archivo.storageKey }),
      );
    }

    await this.archivoRepo.delete(archivoId);
    return { success: true, message: 'Archivo eliminado.' };
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

  // ─── Helper: novedades de un conjunto de empleados ───────────────────────
  // Busca por creadoPor (id_odoo, muy confiable) O por cedula (fallback)
  // Así el jefe ve TODAS las novedades de su equipo sin importar cómo
  // se registró la cédula.
  private async novedadesPorCedulas(
    empleados: Array<{ cedula: string; nombre: string; departamento: string; cargo: string; idOdoo?: number }>,
  ) {
    if (!empleados.length) return [];

    // Obtener id_odoo y cédulas únicas (filtrando nulos)
    const idOdoos = [
      ...new Set(empleados.map((e) => e.idOdoo).filter((x): x is number => !!x)),
    ];
    const cedulas = [
      ...new Set(empleados.map((e) => e.cedula).filter(Boolean)),
    ];

    if (!idOdoos.length && !cedulas.length) return [];

    // Construir condiciones: creado_por IN (...) OR cedula IN (...)
    const conditions: string[] = [];

    if (idOdoos.length) {
      conditions.push(`n.creado_por IN (${idOdoos.join(',')})`);
    }

    if (cedulas.length) {
      const escaped = cedulas
        .map((c) => `'${String(c).replace(/'/g, "''")}'`)
        .join(', ');
      conditions.push(`n.cedula IN (${escaped})`);
    }

    const novedades = await this.novedadRepo
      .createQueryBuilder('n')
      .where(conditions.join(' OR '))
      .orderBy('n.createdAt', 'DESC')
      .getMany();

    const empByCedula = new Map(empleados.map((e) => [e.cedula, e]));
    const empByIdOdoo = new Map(
      empleados.filter((e) => e.idOdoo).map((e) => [e.idOdoo!, e]),
    );

    return novedades.map((n) => {
      const emp = empByCedula.get(n.cedula) ?? empByIdOdoo.get(n.creadoPor!);
      return {
        ...n,
        departamento: emp?.departamento ?? null,
        cargo: emp?.cargo ?? null,
      };
    });
  }

  // ─── ÁREA: solo empleados cuyo area_id pertenece a este responsable ───────
  async findPorAreaResponsable(idOdoo: number) {
    const empleados: Array<{ cedula: string; nombre: string; departamento: string; cargo: string; idOdoo?: number }> =
      await this.dataSource.query(`
        SELECT u.identificacion AS cedula, u.nombre, u.departamento, u.cargo, u.id_odoo AS idOdoo
        FROM   usuarios_registrados u
        INNER  JOIN maestro_areas a    ON u.area_id = a.id
        INNER  JOIN usuarios_registrados r ON a.responsable_id = r.id
        WHERE  r.id_odoo = ${idOdoo}
          AND  u.identificacion IS NOT NULL
        UNION
        SELECT identificacion AS cedula, nombre, departamento, cargo, id_odoo AS idOdoo
        FROM   usuarios_registrados
        WHERE  id_odoo = ${idOdoo}
          AND  identificacion IS NOT NULL
      `);
    return this.novedadesPorCedulas(empleados);
  }

  // ─── SEGMENTO: TODOS los empleados del segmento, sin importar area_id ────
  async findPorSegmentoResponsable(idOdoo: number) {
    const empleados: Array<{ cedula: string; nombre: string; departamento: string; cargo: string; idOdoo?: number }> =
      await this.dataSource.query(`
        SELECT u.identificacion AS cedula, u.nombre, u.departamento, u.cargo, u.id_odoo AS idOdoo
        FROM   usuarios_registrados u
        INNER  JOIN maestro_segmentos s ON u.segmento_id = s.id
        INNER  JOIN usuarios_registrados r ON s.responsable_id = r.id
        WHERE  r.id_odoo = ${idOdoo}
          AND  u.identificacion IS NOT NULL
        UNION
        SELECT identificacion AS cedula, nombre, departamento, cargo, id_odoo AS idOdoo
        FROM   usuarios_registrados
        WHERE  id_odoo = ${idOdoo}
          AND  identificacion IS NOT NULL
      `);
    return this.novedadesPorCedulas(empleados);
  }

  // ─── MI SEGMENTO: todos en el segmento al que pertenece este usuario ────────
  // Diferencia vs findPorSegmentoResponsable: NO requiere ser responsable.
  // Solo necesita que el usuario tenga un segmento_id asignado.
  async findPorMiSegmento(idOdoo: number) {
    const empleados: Array<{ cedula: string; nombre: string; departamento: string; cargo: string; idOdoo?: number }> =
      await this.dataSource.query(`
        SELECT u.identificacion AS cedula, u.nombre, u.departamento, u.cargo, u.id_odoo AS idOdoo
        FROM   usuarios_registrados u
        WHERE  u.segmento_id = (
                 SELECT segmento_id FROM usuarios_registrados WHERE id_odoo = ${idOdoo} LIMIT 1
               )
          AND  u.identificacion IS NOT NULL
        UNION
        SELECT identificacion AS cedula, nombre, departamento, cargo, id_odoo AS idOdoo
        FROM   usuarios_registrados
        WHERE  id_odoo = ${idOdoo}
          AND  identificacion IS NOT NULL
      `);
    return this.novedadesPorCedulas(empleados);
  }

  // ─── DEPARTAMENTO: todos en los deptos del director ───────────────────────
  async findPorDepartamentos(departamentos: string[]) {
    if (!departamentos.length) return [];

    const escapedDeptos = departamentos
      .map((d) => `'${d.replace(/'/g, "''")}'`)
      .join(', ');

    const empleados: Array<{ cedula: string; nombre: string; departamento: string; cargo: string; idOdoo?: number }> =
      await this.dataSource.query(`
        SELECT identificacion AS cedula, nombre, departamento, cargo, id_odoo AS idOdoo
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

    const novedades = await qb.getMany();

    // Enriquecer cada novedad con sus archivos
    const ids = novedades.map((n) => n.id);
    if (!ids.length) return [];

    const archivos = await this.archivoRepo
      .createQueryBuilder('a')
      .where('a.novedad_id IN (:...ids)', { ids })
      .orderBy('a.created_at', 'ASC')
      .getMany();

    const archivosPorNovedad = new Map<number, typeof archivos>();
    for (const a of archivos) {
      const lista = archivosPorNovedad.get(a.novedadId) ?? [];
      lista.push(a);
      archivosPorNovedad.set(a.novedadId, lista);
    }

    return novedades.map((n) => ({
      ...n,
      archivos: (archivosPorNovedad.get(n.id) ?? []).map((a) => ({
        id: a.id,
        nombreOriginal: a.nombreOriginal,
        mime: a.mime,
        tamano: a.tamano,
        url: `/usuarios/novedades/${n.id}/archivos/${a.id}/file`,
      })),
    }));
  }

  // ─── FIND ONE ──────────────────────────────────────────────────────────────
  async findOne(id: number) {
    const novedad = await this.novedadRepo.findOneBy({ id });
    if (!novedad) throw new NotFoundException('Novedad no encontrada.');

    const archivos = await this.getArchivos(id);

    // Mantener fileUrl legacy (por compatibilidad con vistas antiguas)
    let fileUrl: string | null = null;
    if (novedad.soporteStorageKey) {
      fileUrl = await this.resolveUrl(novedad.soporteStorageKey, novedad.soporteStorageMode);
    }
    return { ...novedad, fileUrl, archivos };
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
  // CARPETAS PERSONALIZADAS (independientes por módulo)
  //   tipo = 'rrhh'         → Capital Humano   → campo: estadoCh
  //   tipo = 'coordinador'  → Jefe/Coordinador → campo: estadoChCoord
  // ══════════════════════════════════════════════════════════════════

  /** Devuelve las carpetas del tipo indicado */
  async findEstadosCh(tipo: string = 'rrhh'): Promise<NovedadEstadoCh[]> {
    return this.estadoChRepo.find({
      where: { tipo },
      order: { orden: 'ASC', createdAt: 'ASC' },
    });
  }

  /** Crea una nueva carpeta para el tipo indicado */
  async crearEstadoCh(
    nombre: string,
    icono: string,
    color: string,
    tipo: string = 'rrhh',
  ): Promise<NovedadEstadoCh> {
    // Unicidad dentro del mismo tipo
    const existe = await this.estadoChRepo.findOneBy({ nombre, tipo });
    if (existe) throw new ConflictException(`La carpeta "${nombre}" ya existe en este módulo.`);
    const totalActual = await this.estadoChRepo.count({ where: { tipo } });
    const estado = this.estadoChRepo.create({
      nombre,
      icono: icono || 'fas fa-folder',
      color: color || '#6b7280',
      orden: totalActual,
      tipo,
    });
    return this.estadoChRepo.save(estado);
  }

  /** Edita nombre/icono/color de una carpeta existente */
  async editarEstadoCh(
    id: number,
    nombre: string,
    icono: string,
    color: string,
  ): Promise<NovedadEstadoCh> {
    const estado = await this.estadoChRepo.findOneBy({ id });
    if (!estado) throw new NotFoundException('Carpeta no encontrada.');

    const oldNombre = estado.nombre;

    // Verificar que el nuevo nombre no choque con otro del mismo tipo
    if (nombre !== oldNombre) {
      const choque = await this.estadoChRepo.findOneBy({ nombre, tipo: estado.tipo });
      if (choque) throw new ConflictException(`La carpeta "${nombre}" ya existe en este módulo.`);
    }

    estado.nombre = nombre;
    estado.icono  = icono  || 'fas fa-folder';
    estado.color  = color  || '#6b7280';
    const saved = await this.estadoChRepo.save(estado);

    // Si cambió el nombre, propagar a las novedades que tenían el nombre viejo
    if (oldNombre !== nombre) {
      if (estado.tipo === 'coordinador') {
        await this.novedadRepo.createQueryBuilder()
          .update(Novedad).set({ estadoChCoord: nombre })
          .where('estado_ch_coord = :old', { old: oldNombre })
          .execute();
      } else {
        await this.novedadRepo.createQueryBuilder()
          .update(Novedad).set({ estadoCh: nombre })
          .where('estado_ch = :old', { old: oldNombre })
          .execute();
      }
    }

    return saved;
  }

  /** Elimina una carpeta y limpia su referencia en novedades */
  async eliminarEstadoCh(id: number): Promise<{ success: boolean }> {
    const estado = await this.estadoChRepo.findOneBy({ id });
    if (!estado) throw new NotFoundException('Carpeta no encontrada.');

    if (estado.tipo === 'coordinador') {
      await this.novedadRepo.createQueryBuilder()
        .update(Novedad).set({ estadoChCoord: null })
        .where('estado_ch_coord = :nombre', { nombre: estado.nombre })
        .execute();
    } else {
      await this.novedadRepo.createQueryBuilder()
        .update(Novedad).set({ estadoCh: null })
        .where('estado_ch = :nombre', { nombre: estado.nombre })
        .execute();
    }

    await this.estadoChRepo.remove(estado);
    return { success: true };
  }

  /**
   * Asigna (o limpia) la carpeta en una novedad.
   * tipo = 'rrhh'        → actualiza estadoCh
   * tipo = 'coordinador' → actualiza estadoChCoord
   */
  async cambiarEstadoCh(
    novedadId: number,
    estadoCh: string | null,
    tipo: string = 'rrhh',
  ): Promise<Novedad> {
    const novedad = await this.novedadRepo.findOneBy({ id: novedadId });
    if (!novedad) throw new NotFoundException('Novedad no encontrada.');
    if (tipo === 'coordinador') {
      novedad.estadoChCoord = estadoCh ?? null;
    } else {
      novedad.estadoCh = estadoCh ?? null;
    }
    return this.novedadRepo.save(novedad);
  }
}
