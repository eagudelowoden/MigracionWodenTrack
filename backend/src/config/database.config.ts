import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Company } from '../companies/entities/company.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Permiso } from '../usuarios/entities/permiso.entity';
import { Segmento } from '../usuarios/entities/segmento.entity';
import { Area } from '../usuarios/entities/area.entity';
import { Announcement } from 'src/notifications/entities/notificacion.entity';
import { PermisoDepartamento } from '../usuarios/entities/permiso-departamento.entity';
import { Novedad } from '../novedades/entities/novedad.entity';
import { MallaHoraria } from '../mallas/entities/malla-horaria.entity';
import { MallaDetalle } from '../mallas/entities/malla-detalle.entity';
import { MallaAsignacion } from '../mallas/entities/malla-asignacion.entity';
import { SistemaConfig } from '../sistema-config/entities/sistema-config.entity';
import { HoraExtraCargue } from '../horas-extra/entities/hora-extra-cargue.entity';

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
    Company,
    Usuario,
    Permiso,
    Segmento,
    Area,
    Announcement,
    PermisoDepartamento,
    Novedad,
    MallaHoraria,
    MallaDetalle,
    MallaAsignacion,
    SistemaConfig,
    HoraExtraCargue,
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
