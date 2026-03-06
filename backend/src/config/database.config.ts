import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Company } from '../companies/entities/company.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Permiso } from '../usuarios/entities/permiso.entity'; // <--- IMPORTANTE
import { Segmento } from '../usuarios/entities/segmento.entity'; // <--- IMPORTANTE
import { Area } from '../usuarios/entities/area.entity'; // <--- IMPORTANTE

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'mssql',
  host: configService.get<string>('DB_HOST'),
  // Aquí está el arreglo: forzamos a que sea un número
  port: Number(configService.get<string>('DB_PORT', '1433')), 
  username: configService.get<string>('DB_USER'),
  password: configService.get<string>('DB_PASS'),
  database: configService.get<string>('DB_NAME'),
  entities: [Company, Usuario, Permiso, Segmento, Area], // <--- Asegúrate de incluir tu entidad Usuario aquí
  synchronize: true, 
  options: {
    encrypt: false, 
    trustServerCertificate: true,
  },
});