import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MallasSolicitud } from './entities/mallas-solicitud.entity';

@Injectable()
export class SuperAdminSolicitudesService {
  constructor(
    @InjectRepository(MallasSolicitud)
    private readonly repo: Repository<MallasSolicitud>,
  ) {}

  async getAll() {
    return this.repo.find({ order: { created_at: 'DESC' } });
  }

  async getPendientes() {
    return this.repo.find({ where: { estado: 'pendiente' }, order: { created_at: 'DESC' } });
  }

  async crear(data: {
    solicitante_id_odoo: number;
    solicitante_nombre: string;
    area_nombre?: string;
    segmento_nombre?: string;
    mensaje?: string;
  }) {
    const solicitud = this.repo.create({
      ...data,
      estado: 'pendiente',
    });
    return this.repo.save(solicitud);
  }

  async atender(id: number, estado: 'aprobado' | 'rechazado', atendido_por: string) {
    await this.repo.update(id, {
      estado,
      atendido_por,
      fecha_atencion: new Date(),
    });
    return this.repo.findOne({ where: { id } });
  }

  async countPendientes() {
    return this.repo.count({ where: { estado: 'pendiente' } });
  }
}
