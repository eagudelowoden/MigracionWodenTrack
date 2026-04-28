import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Area } from '../usuarios/entities/area.entity';
import { Segmento } from '.././usuarios/entities/segmento.entity';

@Injectable()
export class OrganizacionService {
  constructor(
    @InjectRepository(Area)
    private readonly areaRepo: Repository<Area>,

    @InjectRepository(Segmento)
    private readonly segmentoRepo: Repository<Segmento>,
  ) {}

  // --- LÓGICA PARA ÁREAS ---

  async getAreas() {
    // Traemos las áreas con la información del jefe (responsable)
    return await this.areaRepo.find({
      relations: ['responsable'],
    });
  }

  async createArea(data: {
    nombre: string;
    responsableId: number;
    departamento?: string;
    creadoPor?: string;
  }) {
    const nuevaArea = this.areaRepo.create({
      nombre: data.nombre,
      departamento: data.departamento?.trim() || null,
      responsable: { id: data.responsableId } as any,
      creado_por: data.creadoPor ?? null,
    });
    return await this.areaRepo.save(nuevaArea);
  }

  async getAreasAgrupadas(): Promise<Record<string, any[]>> {
    const areas = await this.areaRepo.find({ relations: ['responsable'] });
    const grupos: Record<string, any[]> = {};
    for (const area of areas) {
      const key = area.departamento?.trim() || 'Sin departamento';
      if (!grupos[key]) grupos[key] = [];
      grupos[key].push(area);
    }
    return grupos;
  }

  async updateArea(
    id: number,
    data: { departamento?: string; responsableId?: number; nombre?: string },
  ) {
    const area = await this.areaRepo.findOne({
      where: { id },
      relations: ['responsable'],
    });
    if (!area) throw new Error(`Área con id ${id} no encontrada`);

    if (data.nombre !== undefined) area.nombre = data.nombre.trim();
    if (data.departamento !== undefined)
      area.departamento = data.departamento?.trim() || null;
    if (data.responsableId !== undefined) {
      area.responsable = { id: data.responsableId } as any;
    }

    return await this.areaRepo.save(area);
  }

  // --- LÓGICA PARA SEGMENTOS ---

  async getSegmentos() {
    return await this.segmentoRepo.find({
      relations: ['responsable'],
    });
  }

  async createSegmento(data: {
    nombre: string;
    responsableId: number;
    creadoPor?: string;
  }) {
    const nuevoSegmento = this.segmentoRepo.create({
      nombre: data.nombre,
      responsable: { id: data.responsableId } as any,
      creado_por: data.creadoPor ?? null,
    });
    return await this.segmentoRepo.save(nuevoSegmento);
  }
}
