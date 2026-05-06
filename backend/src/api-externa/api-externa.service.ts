import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { ApiCredencial } from './entities/api-credencial.entity';
import { ApiCampoConfig } from './entities/api-campo-config.entity';
import { UsuariosService } from '../usuarios/usuarios.service';
import { MallaAsignacion } from '../mallas/entities/malla-asignacion.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';

// Campos disponibles por defecto (se siembran en la primera ejecución)
const CAMPOS_DEFAULT: Omit<ApiCampoConfig, 'id'>[] = [
  { campo: 'cedula', label: 'Cédula colaborador', activo: true, orden: 1 },
  { campo: 'nombre', label: 'Nombres y apellidos', activo: true, orden: 2 },
  {
    campo: 'inicio_turno',
    label: 'Fecha y hora inicio turno',
    activo: true,
    orden: 3,
  },
  {
    campo: 'fin_turno',
    label: 'Fecha y hora fin turno',
    activo: true,
    orden: 4,
  },
  {
    campo: 'fecha_entrada',
    label: 'Fecha real entrada',
    activo: true,
    orden: 5,
  },
  { campo: 'fecha_salida', label: 'Fecha real salida', activo: true, orden: 6 },
];

@Injectable()
export class ApiExternaService implements OnModuleInit {
  constructor(
    @InjectRepository(ApiCredencial)
    private readonly credRepo: Repository<ApiCredencial>,
    @InjectRepository(ApiCampoConfig)
    private readonly camposRepo: Repository<ApiCampoConfig>,
    @InjectRepository(MallaAsignacion)
    private readonly mallaAsigRepo: Repository<MallaAsignacion>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    private readonly usuariosService: UsuariosService,
  ) {}

  // ─── Sembrar campos por defecto si la tabla está vacía ────────────────────
  async onModuleInit() {
    const count = await this.camposRepo.count();
    if (count === 0) {
      await this.camposRepo.save(
        CAMPOS_DEFAULT.map((c) => this.camposRepo.create(c)),
      );
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Hashing de contraseñas con PBKDF2 (Node crypto nativo)
  // ──────────────────────────────────────────────────────────────────────────
  private hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto
      .pbkdf2Sync(password, salt, 100_000, 64, 'sha512')
      .toString('hex');
    return `${salt}:${hash}`;
  }

  private verifyPassword(password: string, stored: string): boolean {
    const [salt, hash] = stored.split(':');
    if (!salt || !hash) return false;
    const verify = crypto
      .pbkdf2Sync(password, salt, 100_000, 64, 'sha512')
      .toString('hex');
    try {
      return crypto.timingSafeEqual(
        Buffer.from(hash, 'hex'),
        Buffer.from(verify, 'hex'),
      );
    } catch {
      return false;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // AUTH
  // ──────────────────────────────────────────────────────────────────────────
  async login(
    username: string,
    password: string,
  ): Promise<{ token: string; nombre: string } | null> {
    const cred = await this.credRepo.findOne({
      where: { username, activa: true },
    });
    if (!cred) return null;
    if (!this.verifyPassword(password, cred.passwordHash)) return null;

    // Actualizar último uso
    cred.ultimoUso = new Date();
    await this.credRepo.save(cred);

    return { token: cred.token, nombre: cred.nombre };
  }

  async validateToken(token: string): Promise<ApiCredencial | null> {
    if (!token) return null;
    const cred = await this.credRepo.findOne({
      where: { token, activa: true },
    });
    if (!cred) return null;

    // Actualizar timestamp del último uso (sin await para no bloquear la respuesta)
    this.credRepo.update(cred.id, { ultimoUso: new Date() }).catch(() => {});
    return cred;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ASISTENCIAS (endpoint público protegido con token)
  // ──────────────────────────────────────────────────────────────────────────
  async getAsistencias(
    fechaInicio: string,
    fechaFin: string,
    cedula?: string,
  ): Promise<any[]> {
    // 1. Datos de asistencia desde Odoo + malla local
    const raw: any[] = await this.usuariosService.getReporteNovedades(
      false,
      undefined,
      fechaInicio,
      fechaFin,
    );
    if (!raw.length) return [];

    // 2. Campos activos
    const camposActivos = await this.camposRepo.find({
      where: { activo: true },
      order: { orden: 'ASC' },
    });
    const activosSet = new Set(camposActivos.map((c) => c.campo));

    // 3. Mapear cédula → id_odoo para cruzar con malla
    let mallaMap: Map<string, any[]> = new Map(); // key = cedula
    const necesitaTurno =
      activosSet.has('inicio_turno') || activosSet.has('fin_turno');

    if (necesitaTurno) {
      const ccs = [
        ...new Set(raw.map((r) => r.cc).filter((c) => c && c !== 'N/A')),
      ];
      if (ccs.length) {
        const usuarios = await this.usuarioRepo.find({
          where: { identificacion: In(ccs) },
          select: ['id_odoo', 'identificacion'],
        });
        const ccToIdOdoo = new Map(
          usuarios.map((u) => [u.identificacion, u.id_odoo]),
        );
        const idOdoos = usuarios.map((u) => u.id_odoo);

        if (idOdoos.length) {
          const asignaciones = await this.mallaAsigRepo.find({
            where: { usuario_id_odoo: In(idOdoos) },
            relations: ['malla', 'malla.detalles'],
          });

          for (const [cc, idOdoo] of ccToIdOdoo) {
            mallaMap.set(
              cc,
              asignaciones.filter((a) => a.usuario_id_odoo === idOdoo),
            );
          }
        }
      }
    }

    // 4. Construir respuesta filtrando por campos activos
    return raw
      .filter((r) => !cedula || r.cc === cedula)
      .map((r) => {
        const turno = necesitaTurno
          ? this.resolveTurno(mallaMap.get(r.cc) ?? [], r.fecha)
          : null;

        const full: Record<string, any> = {
          cedula: r.cc,
          nombre: r.empleado,
          inicio_turno: turno?.inicio ?? null,
          fin_turno: turno?.fin ?? null,
          fecha_entrada: r.check_in ?? null,
          fecha_salida: r.check_out ?? null,
        };

        return Object.fromEntries(
          Object.entries(full).filter(([k]) => activosSet.has(k)),
        );
      });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Calcular turno de la malla para una fecha dada
  // ──────────────────────────────────────────────────────────────────────────
  private resolveTurno(
    asignaciones: MallaAsignacion[],
    fecha: string, // YYYY-MM-DD
  ): { inicio: string; fin: string } | null {
    if (!asignaciones.length) return null;

    const fechaDate = new Date(fecha + 'T00:00:00');
    const vigente = asignaciones
      .filter((a) => {
        const desde = a.fecha_inicio
          ? new Date(a.fecha_inicio)
          : new Date('2000-01-01');
        const hasta = a.fecha_fin
          ? new Date(a.fecha_fin)
          : new Date('2099-12-31');
        return fechaDate >= desde && fechaDate <= hasta;
      })
      .sort((a, b) => {
        const da = new Date(a.fecha_inicio ?? '2000-01-01').getTime();
        const db = new Date(b.fecha_inicio ?? '2000-01-01').getTime();
        return db - da;
      })[0];

    if (!vigente?.malla?.detalles?.length) return null;

    // día de semana Colombia: Lun=0 … Dom=6
    const diaSemana = fechaDate.getDay() === 0 ? 6 : fechaDate.getDay() - 1;
    const turno = vigente.malla.detalles
      .filter((d: any) => Number(d.dia_semana) === diaSemana)
      .sort(
        (a: any, b: any) => Number(a.hora_inicio) - Number(b.hora_inicio),
      )[0];

    if (!turno) return null;

    const horaInicio = Number(turno.hora_inicio);
    const horaFin = Number(turno.hora_fin);

    // Para turno nocturno, fin puede ser el día siguiente
    let fechaFin = fecha;
    if (horaFin < horaInicio) {
      const nextDay = new Date(fechaDate);
      nextDay.setDate(nextDay.getDate() + 1);
      fechaFin = nextDay.toISOString().split('T')[0];
    }

    return {
      inicio: this.decimalToTimestamp(fecha, horaInicio),
      fin: this.decimalToTimestamp(fechaFin, horaFin),
    };
  }

  private decimalToTimestamp(fecha: string, horaDecimal: number): string {
    const h = Math.floor(horaDecimal);
    const m = Math.round((horaDecimal - h) * 60);
    return `${fecha} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // GESTIÓN DE CAMPOS (SuperAdmin)
  // ──────────────────────────────────────────────────────────────────────────
  async getCampos(): Promise<ApiCampoConfig[]> {
    return this.camposRepo.find({ order: { orden: 'ASC' } });
  }

  async updateCampos(
    updates: { campo: string; activo: boolean }[],
  ): Promise<ApiCampoConfig[]> {
    for (const u of updates) {
      await this.camposRepo.update({ campo: u.campo }, { activo: u.activo });
    }
    return this.getCampos();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // GESTIÓN DE CREDENCIALES (SuperAdmin)
  // ──────────────────────────────────────────────────────────────────────────
  async getCredenciales(): Promise<Omit<ApiCredencial, 'passwordHash'>[]> {
    const all = await this.credRepo.find({ order: { creadoEn: 'DESC' } });
    return all.map(({ passwordHash: _pw, ...rest }) => rest);
  }

  async createCredencial(
    nombre: string,
    username: string,
    password: string,
  ): Promise<Omit<ApiCredencial, 'passwordHash'>> {
    const passwordHash = this.hashPassword(password);
    const token = uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, ''); // 64 chars
    const cred = this.credRepo.create({
      nombre,
      username,
      passwordHash,
      token,
      activa: true,
      ultimoUso: null,
    });
    const saved = await this.credRepo.save(cred);
    const { passwordHash: _pw, ...rest } = saved;
    return rest;
  }

  async deleteCredencial(id: number): Promise<void> {
    await this.credRepo.delete(id);
  }

  async regenerarToken(
    id: number,
  ): Promise<Omit<ApiCredencial, 'passwordHash'> | null> {
    const cred = await this.credRepo.findOneBy({ id });
    if (!cred) return null;
    cred.token = uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '');
    const saved = await this.credRepo.save(cred);
    const { passwordHash: _pw, ...rest } = saved;
    return rest;
  }

  async toggleCredencial(id: number, activa: boolean): Promise<void> {
    await this.credRepo.update(id, { activa });
  }
}
