import { Injectable, NotFoundException, ConflictException, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuloDisponible } from './entities/modulo-disponible.entity';

interface CreateModuloDto {
  slug: string;
  nombre: string;
  descripcion?: string;
  grupo: string;
  grupo_label: string;
  grupo_icon?: string;
  orden?: number;
  es_scope?: boolean;
  creado_por?: string;
}

interface UpdateModuloDto {
  nombre?: string;
  descripcion?: string;
  grupo?: string;
  grupo_label?: string;
  grupo_icon?: string;
  orden?: number;
  activo?: boolean;
  es_scope?: boolean;
}

const SEED_DATA: Omit<ModuloDisponible, 'id' | 'fecha_creacion'>[] = [
  // ── Super Admin ─────────────────────────────────────────────────────────────
  { slug: 'super.superadmin', nombre: 'Super Admin', descripcion: 'Acceso a la vista del panel — los módulos visibles dependen de los permisos super.* asignados individualmente', grupo: 'super', grupo_label: 'Super Admin', grupo_icon: 'fas fa-shield-halved', orden: 0, activo: true, es_scope: false, es_base: true, creado_por: 'sistema' },
  { slug: 'super.dashboard', nombre: 'Dashboard', descripcion: 'Vista general y métricas del sistema', grupo: 'super', grupo_label: 'Super Admin', grupo_icon: 'fas fa-shield-halved', orden: 1, activo: true, es_scope: false, es_base: true, creado_por: 'sistema' },
  { slug: 'super.gestionarapk', nombre: 'Gestionar APK', descripcion: 'Publicación y versionado de aplicaciones', grupo: 'super', grupo_label: 'Super Admin', grupo_icon: 'fas fa-shield-halved', orden: 2, activo: true, es_scope: false, es_base: true, creado_por: 'sistema' },
  { slug: 'super.companias', nombre: 'Compañías', descripcion: 'Administración de empresas registradas', grupo: 'super', grupo_label: 'Super Admin', grupo_icon: 'fas fa-shield-halved', orden: 3, activo: true, es_scope: false, es_base: true, creado_por: 'sistema' },
  { slug: 'super.personal', nombre: 'Personal', descripcion: 'Gestión de colaboradores y sincronización', grupo: 'super', grupo_label: 'Super Admin', grupo_icon: 'fas fa-shield-halved', orden: 4, activo: true, es_scope: false, es_base: true, creado_por: 'sistema' },
  { slug: 'super.avisos', nombre: 'Avisos', descripcion: 'Envío de notificaciones masivas', grupo: 'super', grupo_label: 'Super Admin', grupo_icon: 'fas fa-shield-halved', orden: 5, activo: true, es_scope: false, es_base: true, creado_por: 'sistema' },
  { slug: 'super.organizacion', nombre: 'Organización', descripcion: 'Estructura de áreas y segmentos', grupo: 'super', grupo_label: 'Super Admin', grupo_icon: 'fas fa-shield-halved', orden: 6, activo: true, es_scope: false, es_base: true, creado_por: 'sistema' },
  { slug: 'super.mallas', nombre: 'Mallas', descripcion: 'Gestión global de horarios y turnos', grupo: 'super', grupo_label: 'Super Admin', grupo_icon: 'fas fa-shield-halved', orden: 7, activo: true, es_scope: false, es_base: true, creado_por: 'sistema' },
  { slug: 'super.analitica', nombre: 'Analítica HR', descripcion: 'Reportes y métricas de recursos humanos', grupo: 'super', grupo_label: 'Super Admin', grupo_icon: 'fas fa-shield-halved', orden: 8, activo: true, es_scope: false, es_base: true, creado_por: 'sistema' },
  { slug: 'super.sesiones', nombre: 'Sesiones', descripcion: 'Supervisión de sesiones activas', grupo: 'super', grupo_label: 'Super Admin', grupo_icon: 'fas fa-shield-halved', orden: 9, activo: true, es_scope: false, es_base: true, creado_por: 'sistema' },
  { slug: 'super.mensajes', nombre: 'Mensajes', descripcion: 'Centro de mensajería interna', grupo: 'super', grupo_label: 'Super Admin', grupo_icon: 'fas fa-shield-halved', orden: 10, activo: true, es_scope: false, es_base: true, creado_por: 'sistema' },
  { slug: 'super.recordatorios', nombre: 'Recordatorios', descripcion: 'Gestión de recordatorios automáticos', grupo: 'super', grupo_label: 'Super Admin', grupo_icon: 'fas fa-shield-halved', orden: 11, activo: true, es_scope: false, es_base: true, creado_por: 'sistema' },
  { slug: 'super.configuracion', nombre: 'Configuración', descripcion: 'Parámetros generales del sistema', grupo: 'super', grupo_label: 'Super Admin', grupo_icon: 'fas fa-shield-halved', orden: 12, activo: true, es_scope: false, es_base: true, creado_por: 'sistema' },
  { slug: 'super.api', nombre: 'API Externa', descripcion: 'Configuración de integraciones y webhooks', grupo: 'super', grupo_label: 'Super Admin', grupo_icon: 'fas fa-shield-halved', orden: 13, activo: true, es_scope: false, es_base: true, creado_por: 'sistema' },
  { slug: 'super.solicitudes', nombre: 'Solicitudes', descripcion: 'Gestión de solicitudes de apertura de cargue de mallas', grupo: 'super', grupo_label: 'Super Admin', grupo_icon: 'fas fa-shield-halved', orden: 14, activo: true, es_scope: false, es_base: true, creado_por: 'sistema' },
  // ── Panel Admin ──────────────────────────────────────────────────────────────
  { slug: 'admin.admin', nombre: 'Admin General', descripcion: 'Acceso al panel de administración', grupo: 'admin', grupo_label: 'Panel Admin', grupo_icon: 'fas fa-user-shield', orden: 0, activo: true, es_scope: false, es_base: true, creado_por: 'sistema' },
  { slug: 'admin.asistencias', nombre: 'Asistencias', descripcion: 'Consulta y gestión de registros de asistencia', grupo: 'admin', grupo_label: 'Panel Admin', grupo_icon: 'fas fa-user-shield', orden: 1, activo: true, es_scope: false, es_base: true, creado_por: 'sistema' },
  { slug: 'admin.mallas', nombre: 'Mallas', descripcion: 'Programación y edición de turnos', grupo: 'admin', grupo_label: 'Panel Admin', grupo_icon: 'fas fa-user-shield', orden: 2, activo: true, es_scope: false, es_base: true, creado_por: 'sistema' },
  { slug: 'admin.novedades', nombre: 'Novedades', descripcion: 'Acceso al módulo de novedades', grupo: 'admin', grupo_label: 'Panel Admin', grupo_icon: 'fas fa-user-shield', orden: 3, activo: true, es_scope: false, es_base: true, creado_por: 'sistema' },
  // ── Gestión de Horas ─────────────────────────────────────────────────────────
  { slug: 'admin.calculos', nombre: 'Cálculos', descripcion: 'Pestaña Cálculos — calcular, exportar y guardar horas extra por rango de fechas', grupo: 'horas', grupo_label: 'Gestión de Horas', grupo_icon: 'fas fa-clock', orden: 0, activo: true, es_scope: false, es_base: true, creado_por: 'sistema' },
  { slug: 'horas.guardados', nombre: 'Guardados', descripcion: 'Pestaña Guardados — historial de registros de horas guardados', grupo: 'horas', grupo_label: 'Gestión de Horas', grupo_icon: 'fas fa-clock', orden: 1, activo: true, es_scope: false, es_base: true, creado_por: 'sistema' },
  { slug: 'horas.novedades_aprobadas', nombre: 'Novedades Aprobadas', descripcion: 'Pestaña Novedades Aprobadas — novedades aprobadas con impacto en horas', grupo: 'horas', grupo_label: 'Gestión de Horas', grupo_icon: 'fas fa-clock', orden: 2, activo: true, es_scope: false, es_base: true, creado_por: 'sistema' },
  { slug: 'horas.cargue', nombre: 'Cargue de Horas', descripcion: 'Pestaña Cargue Horas — subida de archivos e historial de horas cargadas', grupo: 'horas', grupo_label: 'Gestión de Horas', grupo_icon: 'fas fa-clock', orden: 3, activo: true, es_scope: false, es_base: true, creado_por: 'sistema' },
  { slug: 'horas.ver_cargue_ch', nombre: 'Ver Cargue CH', descripcion: 'Visualización del módulo de cargue de horas CH', grupo: 'horas', grupo_label: 'Gestión de Horas', grupo_icon: 'fas fa-clock', orden: 4, activo: true, es_scope: false, es_base: true, creado_por: 'sistema' },
  // ── Alcance de visibilidad ───────────────────────────────────────────────────
  { slug: 'novedades.director', nombre: 'Director de Departamento', descripcion: 'Ve todos los empleados del departamento en asistencias, mallas y novedades', grupo: 'scope', grupo_label: 'Alcance de visibilidad', grupo_icon: 'fas fa-eye', orden: 0, activo: true, es_scope: true, es_base: true, creado_por: 'sistema' },
  { slug: 'novedades.ver_segmento', nombre: 'Jefe de Segmento', descripcion: 'Ve todo el segmento como responsable en asistencias, mallas y novedades', grupo: 'scope', grupo_label: 'Alcance de visibilidad', grupo_icon: 'fas fa-eye', orden: 1, activo: true, es_scope: true, es_base: true, creado_por: 'sistema' },
  { slug: 'coord.ver_segmento', nombre: 'Coordinador de Segmento', descripcion: 'Ve todo el segmento en asistencias, mallas y novedades sin ser responsable', grupo: 'scope', grupo_label: 'Alcance de visibilidad', grupo_icon: 'fas fa-eye', orden: 2, activo: true, es_scope: true, es_base: true, creado_por: 'sistema' },
  { slug: 'novedades.ver_area', nombre: 'Jefe de Área', descripcion: 'Ve los empleados de su área asignada en asistencias, mallas y novedades', grupo: 'scope', grupo_label: 'Alcance de visibilidad', grupo_icon: 'fas fa-eye', orden: 3, activo: true, es_scope: true, es_base: true, creado_por: 'sistema' },
  { slug: 'admin.filtro_departamento', nombre: 'Filtro por Departamento', descripcion: 'Puede filtrar la vista por departamento en asistencias, mallas y cálculos', grupo: 'scope', grupo_label: 'Alcance de visibilidad', grupo_icon: 'fas fa-eye', orden: 4, activo: true, es_scope: true, es_base: true, creado_por: 'sistema' },
  // ── Novedades ────────────────────────────────────────────────────────────────
  { slug: 'marcacion.novedad', nombre: 'Registrar Novedad', descripcion: 'Muestra el botón de novedad en la pantalla de marcación', grupo: 'novedades', grupo_label: 'Novedades', grupo_icon: 'fas fa-file-lines', orden: 0, activo: true, es_scope: false, es_base: true, creado_por: 'sistema' },
  { slug: 'admin.novedades.user', nombre: 'Rol Empleado', descripcion: 'Puede registrar y gestionar sus propias novedades', grupo: 'novedades', grupo_label: 'Novedades', grupo_icon: 'fas fa-file-lines', orden: 1, activo: true, es_scope: false, es_base: true, creado_por: 'sistema' },
  { slug: 'admin.novedades.admin', nombre: 'Rol Administrador', descripcion: 'Gestión completa de novedades del equipo', grupo: 'novedades', grupo_label: 'Novedades', grupo_icon: 'fas fa-file-lines', orden: 2, activo: true, es_scope: false, es_base: true, creado_por: 'sistema' },
  { slug: 'admin.novedades.rrhh', nombre: 'Rol RRHH', descripcion: 'Auditoría, revisión y aprobación de novedades', grupo: 'novedades', grupo_label: 'Novedades', grupo_icon: 'fas fa-file-lines', orden: 3, activo: true, es_scope: false, es_base: true, creado_por: 'sistema' },
  // ── Offboarding ──────────────────────────────────────────────────────────────
  { slug: 'novedades.offboarding.consultas', nombre: 'Offboarding — Consultas', descripcion: 'Acceso al módulo de Consultas: Renuncias aprobadas y Seguimiento de Paz y Salvo', grupo: 'novedades', grupo_label: 'Novedades', grupo_icon: 'fas fa-file-lines', orden: 9, activo: true, es_scope: false, es_base: false, creado_por: 'sistema' },
  { slug: 'novedades.offboarding.sst', nombre: 'Offboarding — SST', descripcion: 'Acceso al módulo SST en el proceso de Paz y Salvo', grupo: 'novedades', grupo_label: 'Novedades', grupo_icon: 'fas fa-file-lines', orden: 10, activo: true, es_scope: false, es_base: false, creado_por: 'sistema' },
  { slug: 'novedades.offboarding.ch',  nombre: 'Offboarding — Capital Humano', descripcion: 'Acceso al módulo Capital Humano en el proceso de Paz y Salvo', grupo: 'novedades', grupo_label: 'Novedades', grupo_icon: 'fas fa-file-lines', orden: 11, activo: true, es_scope: false, es_base: false, creado_por: 'sistema' },
  { slug: 'novedades.offboarding.it',  nombre: 'Offboarding — IT', descripcion: 'Acceso al módulo IT en el proceso de Paz y Salvo', grupo: 'novedades', grupo_label: 'Novedades', grupo_icon: 'fas fa-file-lines', orden: 12, activo: true, es_scope: false, es_base: false, creado_por: 'sistema' },
  { slug: 'super.offboarding', nombre: 'Gestión Checklist Offboarding', descripcion: 'Administrar preguntas del checklist de Paz y Salvo por módulo', grupo: 'super', grupo_label: 'Super Admin', grupo_icon: 'fas fa-shield-halved', orden: 17, activo: true, es_scope: false, es_base: false, creado_por: 'sistema' },
];

@Injectable()
export class ModulosDisponiblesService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(ModuloDisponible)
    private readonly repo: Repository<ModuloDisponible>,
  ) {}

  async onApplicationBootstrap() {
    await this.seed();
  }

  async seed() {
    for (const data of SEED_DATA) {
      const existe = await this.repo.findOne({ where: { slug: data.slug } });
      if (!existe) {
        await this.repo.save(this.repo.create(data));
      }
    }
  }

  async findAll(): Promise<ModuloDisponible[]> {
    return this.repo.find({ order: { grupo: 'ASC', orden: 'ASC' } });
  }

  async findAgrupados(): Promise<Record<string, { label: string; icon: string; modulos: ModuloDisponible[] }>> {
    const todos = await this.repo.find({
      where: { activo: true },
      order: { grupo: 'ASC', orden: 'ASC' },
    });

    const grupos: Record<string, { label: string; icon: string; modulos: ModuloDisponible[] }> = {};
    for (const m of todos) {
      if (!grupos[m.grupo]) {
        grupos[m.grupo] = { label: m.grupo_label, icon: m.grupo_icon ?? '', modulos: [] };
      }
      grupos[m.grupo].modulos.push(m);
    }
    return grupos;
  }

  async create(dto: CreateModuloDto): Promise<ModuloDisponible> {
    const existe = await this.repo.findOne({ where: { slug: dto.slug } });
    if (existe) throw new ConflictException(`Ya existe un módulo con slug "${dto.slug}"`);
    return this.repo.save(this.repo.create({ ...dto, activo: true, es_base: false }));
  }

  async update(id: number, dto: UpdateModuloDto): Promise<ModuloDisponible> {
    const modulo = await this.repo.findOne({ where: { id } });
    if (!modulo) throw new NotFoundException(`Módulo ${id} no encontrado`);
    Object.assign(modulo, dto);
    return this.repo.save(modulo);
  }

  async toggleActivo(id: number): Promise<ModuloDisponible> {
    const modulo = await this.repo.findOne({ where: { id } });
    if (!modulo) throw new NotFoundException(`Módulo ${id} no encontrado`);
    modulo.activo = !modulo.activo;
    return this.repo.save(modulo);
  }

  async remove(id: number): Promise<void> {
    const modulo = await this.repo.findOne({ where: { id } });
    if (!modulo) throw new NotFoundException(`Módulo ${id} no encontrado`);
    if (modulo.es_base) throw new ConflictException('Los módulos base del sistema no se pueden eliminar');
    await this.repo.remove(modulo);
  }

  async getGruposUnicos(): Promise<{ grupo: string; label: string; icon: string }[]> {
    const modulos = await this.repo
      .createQueryBuilder('m')
      .select(['m.grupo', 'm.grupo_label', 'm.grupo_icon'])
      .groupBy('m.grupo')
      .addGroupBy('m.grupo_label')
      .addGroupBy('m.grupo_icon')
      .orderBy('m.grupo', 'ASC')
      .getMany();

    return modulos.map(m => ({ grupo: m.grupo, label: m.grupo_label, icon: m.grupo_icon ?? '' }));
  }
}
