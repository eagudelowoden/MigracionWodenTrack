import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SesionActiva } from './entities/sesion-activa.entity';
import { InternoGateway } from './interno.gateway';

@Injectable()
export class SuperAdminSesionesService {
  constructor(
    @InjectRepository(SesionActiva)
    private readonly sesionRepo: Repository<SesionActiva>,
    private readonly gateway: InternoGateway,
  ) {}

  getSesionesActivas(): Promise<SesionActiva[]> {
    return this.sesionRepo.find({
      where: { activa: true },
      order: { connected_at: 'DESC' },
    });
  }

  async kickSesion(idOdoo: number): Promise<{ ok: boolean }> {
    await this.gateway.kickUser(idOdoo);
    return { ok: true };
  }
}
