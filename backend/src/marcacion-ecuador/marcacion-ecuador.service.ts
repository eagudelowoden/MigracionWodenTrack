import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarcacionEcuador } from './entities/marcacion-ecuador.entity';

@Injectable()
export class MarcacionEcuadorService {
  constructor(
    @InjectRepository(MarcacionEcuador)
    private readonly repo: Repository<MarcacionEcuador>,
  ) {}

  async marcar(dto: {
    id_odoo: number;
    cedula: string;
    nombre: string;
    tipo: 'entrada' | 'salida';
    latitud?: number | null;
    longitud?: number | null;
    direccion?: string | null;
    company?: string;
  }): Promise<MarcacionEcuador> {
    const fechaHoy = this.fechaEcuador();
    const hora = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'America/Guayaquil',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date());

    const registro = this.repo.create({
      id_odoo: dto.id_odoo,
      cedula: dto.cedula,
      nombre: dto.nombre,
      tipo: dto.tipo,
      latitud: dto.latitud ?? null,
      longitud: dto.longitud ?? null,
      direccion: dto.direccion ?? null,
      fecha: fechaHoy,
      hora,
      company: dto.company || 'Ecuador',
    });
    return this.repo.save(registro);
  }

  async estadoHoy(id_odoo: number): Promise<{
    ultima: MarcacionEcuador | null;
    tipo_pendiente: 'entrada' | 'salida';
    registros_hoy: MarcacionEcuador[];
  }> {
    const hoy = this.fechaEcuador();
    const registros_hoy = await this.repo.find({
      where: { id_odoo, fecha: hoy },
      order: { created_at: 'DESC' },
    });
    const ultima = registros_hoy[0] ?? null;
    const tipo_pendiente =
      !ultima || ultima.tipo === 'salida' ? 'entrada' : 'salida';
    return { ultima, tipo_pendiente, registros_hoy };
  }

  async historial(opts: {
    id_odoo?: number;
    cedula?: string;
    startDate?: string;
    endDate?: string;
    company?: string;
    limit?: number;
  }): Promise<MarcacionEcuador[]> {
    const qb = this.repo
      .createQueryBuilder('m')
      .orderBy('m.fecha', 'DESC')
      .addOrderBy('m.hora', 'DESC')
      .take(opts.limit ?? 500);

    if (opts.id_odoo) qb.andWhere('m.id_odoo = :id_odoo', { id_odoo: opts.id_odoo });
    if (opts.cedula) qb.andWhere('m.cedula = :cedula', { cedula: opts.cedula });
    if (opts.startDate) qb.andWhere('m.fecha >= :from', { from: opts.startDate });
    if (opts.endDate) qb.andWhere('m.fecha <= :to', { to: opts.endDate });
    if (opts.company) qb.andWhere('m.company = :company', { company: opts.company });

    return qb.getMany();
  }

  private fechaEcuador(): string {
    return new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'America/Guayaquil',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }
}
