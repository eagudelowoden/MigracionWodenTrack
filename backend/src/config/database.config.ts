import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Company } from '../companies/entities/company.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Permiso } from '../usuarios/entities/permiso.entity';
import { Segmento } from '../usuarios/entities/segmento.entity';
import { Area } from '../usuarios/entities/area.entity';
import { Announcement } from '../notifications/entities/notificacion.entity';
import { PermisoDepartamento } from '../usuarios/entities/permiso-departamento.entity';
import { Novedad } from '../novedades/entities/novedad.entity';
import { NovedadArchivo } from '../novedades/entities/novedad-archivo.entity';
import { NovedadEstadoCh } from '../novedades/entities/novedad-estado-ch.entity';
import { MallaHoraria } from '../mallas/entities/malla-horaria.entity';
import { MallaDetalle } from '../mallas/entities/malla-detalle.entity';
import { MallaAsignacion } from '../mallas/entities/malla-asignacion.entity';
import { SistemaConfig } from '../sistema-config/entities/sistema-config.entity';
import { HoraExtra } from '../horas-extra/entities/hora-extra.entity';
import { HoraExtraCargue } from '../horas-extra/entities/hora-extra-cargue.entity';
import { CorreoDestinatario } from '../usuarios/entities/correo-destinatario.entity';
import { MallasSolicitud } from '../usuarios/entities/mallas-solicitud.entity';
import { MensajeInterno } from '../usuarios/entities/mensaje-interno.entity';
import { SesionActiva } from '../usuarios/entities/sesion-activa.entity';
import { ApiCredencial } from '../api-externa/entities/api-credencial.entity';
import { ApiCampoConfig } from '../api-externa/entities/api-campo-config.entity';
import { RecordatorioMalla } from '../recordatorios/entities/recordatorio.entity';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const host = configService.get<string>('DB_HOST');
  const db = configService.get<string>('DB_NAME');
  console.log(`🔌 DB conectando a: ${host} / base: ${db}`);
  return {
  type: 'mssql',
  host,
  port: Number(configService.get<string>('DB_PORT', '1433')),
  username: configService.get<string>('DB_USER'),
  password: configService.get<string>('DB_PASS'),
  database: configService.get<string>('DB_NAME'),
  entities: [
    // Empresas y usuarios
    Company,
    Usuario,
    Permiso,
    Segmento,
    Area,
    PermisoDepartamento,
    CorreoDestinatario,
    MallasSolicitud,
    MensajeInterno,
    SesionActiva,
    // Notificaciones
    Announcement,
    // Novedades
    Novedad,
    NovedadArchivo,
    NovedadEstadoCh,
    // Mallas
    MallaHoraria,
    MallaDetalle,
    MallaAsignacion,
    // Horas extra
    HoraExtra,
    HoraExtraCargue,
    // Configuración
    SistemaConfig,
    // API externa
    ApiCredencial,
    ApiCampoConfig,
    // Recordatorios
    RecordatorioMalla,
  ],
  autoLoadEntities: true,
  synchronize: true,
  logging: true,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
  };
};
