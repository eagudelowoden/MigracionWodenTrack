import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OdooModule } from './odoo/odoo.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { AppController } from './app.controller'; // <--- IMPORTANTE: Importar el controlador
import { AppService } from './app.service';
import { ReportsModule } from './reports/reports.module';
import { SubirContratosModule } from './subir-contratos/subir-contratos.module';
import { ApkModule } from './apk/apk.module';
import { CompaniesModule } from './companies/companies.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    OdooModule,
    UsuariosModule,
    ReportsModule,
    SubirContratosModule,
    ApkModule,
    CompaniesModule,
    CompaniesModule,
  ],
  controllers: [AppController], // <--- ¡AQUÍ ESTÁ EL TRUCO! Debe estar en esta lista
  providers: [AppService],
})
export class AppModule { }