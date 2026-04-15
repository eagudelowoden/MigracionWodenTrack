// src/novedades/novedades.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
import { CreateNovedadDto } from './dto/create-novedad.dto';

@Injectable()
export class NovedadesService {
  private readonly storageMode: string;
  private readonly localDir: string;
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(
    @InjectRepository(Novedad)
    private readonly novedadRepo: Repository<Novedad>,
    private readonly config: ConfigService,
  ) {
    this.storageMode = this.config.get<string>('STORAGE_MODE', 'local');
    this.localDir = path.join(process.cwd(), 'uploads', 'novedades');
    this.bucket = this.config.get<string>('AWS_S3_BUCKET', '');

    this.s3 = new S3Client({
      region: this.config.get<string>('AWS_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: this.config.get<string>('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: this.config.get<string>('AWS_SECRET_ACCESS_KEY', ''),
      },
    });

    if (this.storageMode === 'local' && !fs.existsSync(this.localDir)) {
      fs.mkdirSync(this.localDir, { recursive: true });
    }
  }

  // ─── Guardar archivo ───────────────────────────────────────────────────────
  private async saveFile(file: Express.Multer.File, modo: string) {
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;

    if (modo === 's3') {
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
    const modoEfectivo = dto.storageMode || this.storageMode;
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
    return this.novedadRepo.find({ order: { createdAt: 'DESC' } });
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

  // ─── DELETE ───────────────────────────────────────────────────────────────
  async remove(id: number) {
    const novedad = await this.novedadRepo.findOneBy({ id });
    if (!novedad) throw new NotFoundException('Novedad no encontrada.');

    if (novedad.soporteStorageMode === 'local') {
      const filePath = path.join(this.localDir, novedad.soporteStorageKey);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } else {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: novedad.soporteStorageKey,
        }),
      );
    }

    await this.novedadRepo.delete(id);
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
}
