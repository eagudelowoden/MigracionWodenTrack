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

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'mssql',
  host: configService.get<string>('DB_HOST'),
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
  ],
  autoLoadEntities: true,
  synchronize: true,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
});
