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
import { WfsmSerial } from '../wfsm/entities/wfsm-serial.entity';
import { WfsmSyncEstado } from '../wfsm/entities/wfsm-sync-estado.entity';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const host = configService.get<string>('DB_HOST');
  const db = configService.get<string>('DB_NAME');
  const esProduccion = configService.get<string>('NODE_ENV') === 'production';
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
      // WFSM (seriales recuperados)
      WfsmSerial,
      WfsmSyncEstado,
    ],
    autoLoadEntities: true,
    // En producción NO se auto-altera el esquema: un cambio de entidad podría
    // borrar columnas/datos en caliente sin revisión. Los cambios de esquema
    // en prod se aplican a mano (ALTER TABLE), igual que ya se viene haciendo.
    synchronize: !esProduccion,
    // En producción solo error/warn: 'logging: true' imprime CADA query con
    // sus parámetros y ahoga los errores reales entre miles de líneas de ruido.
    logging: esProduccion ? ['error', 'warn'] : true,
    options: {
      encrypt: false,
      trustServerCertificate: true,
      connectTimeout: 30000,
    },
    extra: {
      requestTimeout: 15000,
      pool: {
        min: 2,
        max: 10,
        acquireTimeoutMillis: 30000,
        createTimeoutMillis: 30000,
        idleTimeoutMillis: 30000,
        reapIntervalMillis: 60000,
      },
    },
  };
};
