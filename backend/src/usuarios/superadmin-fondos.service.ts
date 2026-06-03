import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FondoEmpleado } from './entities/fondo-empleado.entity';
import { FondoEmpleadoCorreo } from './entities/fondo-empleado-correo.entity';

@Injectable()
export class SuperAdminFondosService {
  constructor(
    @InjectRepository(FondoEmpleado)
    private readonly fondoRepo: Repository<FondoEmpleado>,
    @InjectRepository(FondoEmpleadoCorreo)
    private readonly correoRepo: Repository<FondoEmpleadoCorreo>,
  ) {}

  // ── Helpers ──────────────────────────────────────────────────────────────
  private mapFondo(f: FondoEmpleado) {
    return {
      id: f.id,
      nombre: f.nombre,
      creado_por: f.creado_por,
      created_at: f.created_at,
      updated_at: f.updated_at,
      correos: (f.correos_rel ?? []).map((c) => c.email),
    };
  }

  // ── GET all ───────────────────────────────────────────────────────────────
  async findAll() {
    const rows = await this.fondoRepo.find({ order: { nombre: 'ASC' } });
    return rows.map(this.mapFondo);
  }

  // ── POST create ───────────────────────────────────────────────────────────
  async create(nombre: string, createdBy: string) {
    const fondo = this.fondoRepo.create({ nombre: nombre.trim(), creado_por: createdBy });
    const saved = await this.fondoRepo.save(fondo);
    return this.mapFondo(saved);
  }

  // ── PATCH update ──────────────────────────────────────────────────────────
  async update(
    id: number,
    data: { nombre?: string; correos?: string[]; updatedBy?: string },
  ) {
    const fondo = await this.fondoRepo.findOne({ where: { id } });
    if (!fondo) throw new NotFoundException(`Fondo ${id} no encontrado`);

    if (data.nombre) {
      fondo.nombre = data.nombre.trim();
      await this.fondoRepo.save(fondo);
    }

    if (Array.isArray(data.correos)) {
      // Reemplazar todos los correos del fondo
      await this.correoRepo.delete({ fondo_id: id });
      if (data.correos.length > 0) {
        const entities = data.correos.map((email) =>
          this.correoRepo.create({ fondo_id: id, email: email.toLowerCase().trim() }),
        );
        await this.correoRepo.save(entities);
      }
    }

    const updated = await this.fondoRepo.findOne({ where: { id } });
    return this.mapFondo(updated!);
  }

  // ── DELETE ────────────────────────────────────────────────────────────────
  async remove(id: number) {
    const fondo = await this.fondoRepo.findOne({ where: { id } });
    if (!fondo) throw new NotFoundException(`Fondo ${id} no encontrado`);
    // correos se eliminan en cascada (onDelete: CASCADE)
    await this.fondoRepo.remove(fondo);
    return { ok: true };
  }

  // ── GET correos de un fondo (util para notificaciones) ────────────────────
  async getCorreosByFondo(id: number): Promise<string[]> {
    const rows = await this.correoRepo.find({ where: { fondo_id: id } });
    return rows.map((r) => r.email);
  }
}
