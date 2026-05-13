import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SistemaConfig } from './entities/sistema-config.entity';

const DEFAULTS: Record<string, { valor: string; descripcion: string }> = {
  storage_mode: { valor: 'local', descripcion: 'Modo de almacenamiento de soportes: local | s3' },
  module_asistencias_active: { valor: 'true', descripcion: 'Módulo Asistencias activo' },
  module_asistencias_message: { valor: 'Módulo en mantenimiento. Vuelve pronto.', descripcion: 'Mensaje cuando Asistencias está inactivo' },
  module_mallas_active: { valor: 'true', descripcion: 'Módulo Mallas activo' },
  module_mallas_message: { valor: 'Módulo en mantenimiento. Vuelve pronto.', descripcion: 'Mensaje cuando Mallas está inactivo' },
  module_novedades_active: { valor: 'true', descripcion: 'Módulo Novedades activo' },
  module_novedades_message: { valor: 'Módulo en mantenimiento. Vuelve pronto.', descripcion: 'Mensaje cuando Novedades está inactivo' },
  mallas_schedule_enabled: { valor: 'false', descripcion: 'Controlar fechas de cargue de mallas' },
  mallas_schedule_mode: { valor: 'free', descripcion: 'Modo de programación: free | weekly | monthly' },
  mallas_schedule_weekly_days: { valor: '[]', descripcion: 'Días de semana habilitados (JSON array: 0=Dom 1=Lun ... 6=Sáb)' },
  mallas_schedule_monthly_days: { valor: '[]', descripcion: 'Días del mes habilitados (JSON array: 1-31)' },
  mallas_schedule_specific_dates: { valor: '[]', descripcion: 'Fechas exactas habilitadas (JSON array de strings YYYY-MM-DD)' },
};

@Injectable()
export class SistemaConfigService implements OnModuleInit {
  constructor(
    @InjectRepository(SistemaConfig)
    private readonly repo: Repository<SistemaConfig>,
  ) {}

  async onModuleInit() {
    for (const [clave, { valor, descripcion }] of Object.entries(DEFAULTS)) {
      const existe = await this.repo.findOne({ where: { clave } });
      if (!existe) {
        await this.repo.save(this.repo.create({ clave, valor, descripcion }));
      }
    }
  }

  async getAll(): Promise<Record<string, string>> {
    const rows = await this.repo.find();
    return Object.fromEntries(rows.map((r) => [r.clave, r.valor]));
  }

  async get(clave: string, defaultValue = ''): Promise<string> {
    const row = await this.repo.findOne({ where: { clave } });
    return row?.valor ?? defaultValue;
  }

  async set(clave: string, valor: string, updatedBy?: string): Promise<void> {
    const row = await this.repo.findOne({ where: { clave } });
    if (row) {
      await this.repo.update({ clave }, { valor, updated_by: updatedBy ?? null });
    } else {
      await this.repo.save(
        this.repo.create({ clave, valor, descripcion: null, updated_by: updatedBy ?? null }),
      );
    }
  }

  async setBulk(updates: Record<string, string>, updatedBy?: string): Promise<void> {
    for (const [clave, valor] of Object.entries(updates)) {
      await this.set(clave, valor, updatedBy);
    }
  }
}
