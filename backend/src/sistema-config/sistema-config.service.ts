import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
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

  // ── Parametrización Horas Extra (solo informativo por ahora; el motor de
  //    cálculo aún usa estos valores fijos en código. Sembrarlos NO cambia el
  //    comportamiento; sirve para mostrarlos en el módulo de super admin) ──────
  hx_inicio_nocturno: { valor: '19', descripcion: 'Hora en que inicia la jornada nocturna (HH 0-23). Ley 2466/2025 = 19' },
  hx_inicio_diurno: { valor: '6', descripcion: 'Hora en que inicia la jornada diurna / fin del nocturno (HH 0-23)' },
  hx_tolerancia_min: { valor: '6', descripcion: 'Tolerancia en minutos para llegada tarde antes de contar reposición' },
  hx_redondeo_min: { valor: '50', descripcion: 'Si la fracción de hora tiene >= estos minutos, sube a la hora completa' },
  hx_max_turno_horas: { valor: '14', descripcion: 'Duración máxima razonable de un turno (h); por encima se considera mal emparejado' },
  hx_umbral_entrada_nocturna: { valor: '21', descripcion: 'Hora mínima (HH) para tratar una entrada sin salida como turno que cruza medianoche' },
  hx_dominical_festivo_modo: { valor: 'todo_extra', descripcion: 'Trabajo en domingo/festivo sin malla: todo_extra | recargo_mas_extra' },
  hx_recargo_nocturno_pct: { valor: '35', descripcion: 'Porcentaje de recargo nocturno (referencia/Excel)' },
  hx_recargo_dominical_pct: { valor: '80', descripcion: 'Porcentaje de recargo dominical/festivo vigente (referencia/Excel)' },
  hx_extra_diurna_pct: { valor: '25', descripcion: 'Porcentaje adicional de hora extra diurna (referencia/Excel)' },
  hx_extra_nocturna_pct: { valor: '75', descripcion: 'Porcentaje adicional de hora extra nocturna (referencia/Excel)' },
};

@Injectable()
export class SistemaConfigService implements OnModuleInit {
  constructor(
    @InjectRepository(SistemaConfig)
    private readonly repo: Repository<SistemaConfig>,
    @InjectDataSource() private readonly ds: DataSource,
  ) {}

  async onModuleInit() {
    for (const [clave, { valor, descripcion }] of Object.entries(DEFAULTS)) {
      // Solo inserta si no existe — nunca pisa un valor que el admin ya cambió
      await this.ds.query(
        `IF NOT EXISTS (SELECT 1 FROM sistema_config WHERE clave = @0)
         INSERT INTO sistema_config (clave, valor, descripcion, updated_at)
         VALUES (@0, @1, @2, GETDATE())`,
        [clave, valor, descripcion],
      );
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
    // MERGE (upsert) directo — evita problemas con repo.save en SQL Server
    await this.ds.query(
      `MERGE sistema_config WITH (HOLDLOCK) AS target
       USING (SELECT @0 AS clave) AS src ON target.clave = src.clave
       WHEN MATCHED THEN
         UPDATE SET valor = @1, updated_by = @2, updated_at = GETDATE()
       WHEN NOT MATCHED THEN
         INSERT (clave, valor, descripcion, updated_by, updated_at)
         VALUES (@0, @1, NULL, @2, GETDATE());`,
      [clave, valor, updatedBy ?? null],
    );
  }

  async setBulk(updates: Record<string, string>, updatedBy?: string): Promise<void> {
    for (const [clave, valor] of Object.entries(updates)) {
      await this.set(clave, valor, updatedBy);
    }
  }
}
