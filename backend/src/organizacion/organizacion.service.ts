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
      relations: ['responsable'] 
    });
  }

  async createArea(data: { nombre: string; responsableId: number }) {
    // Creamos la instancia y guardamos
    const nuevaArea = this.areaRepo.create({
      nombre: data.nombre,
      responsable: { id: data.responsableId } as any // Relacionamos por ID
    });
    return await this.areaRepo.save(nuevaArea);
  }

  // --- LÓGICA PARA SEGMENTOS ---

  async getSegmentos() {
    return await this.segmentoRepo.find({ 
      relations: ['responsable'] 
    });
  }

  async createSegmento(data: { nombre: string; responsableId: number }) {
    const nuevoSegmento = this.segmentoRepo.create({
      nombre: data.nombre,
      responsable: { id: data.responsableId } as any
    });
    return await this.segmentoRepo.save(nuevoSegmento);
  }
}