import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm'; // Importante instalar @nestjs/typeorm
import { OdooModule } from './odoo/odoo.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ReportsModule } from './reports/reports.module';
import { SubirContratosModule } from './subir-contratos/subir-contratos.module';
import { ApkModule } from './apk/apk.module';
import { CompaniesModule } from './companies/companies.module';
import { getDatabaseConfig } from './config/database.config'; // Tu archivo de configuración
import { NotificationsModule } from './notifications/notifications.module';
import { OrganizacionModule } from './organizacion/organizacion.module';

@Module({
  imports: [
    // 1. Carga de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 2. Configuración Asíncrona de la Base de Datos (SQL Server)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        getDatabaseConfig(configService),
    }),

    // 3. Tus módulos funcionales
    OdooModule,
    UsuariosModule,
    ReportsModule,
    SubirContratosModule,
    ApkModule,
    CompaniesModule, // (Ya no está duplicado)
    NotificationsModule,
    OrganizacionModule, // <--- Agregado el módulo de notificaciones
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
