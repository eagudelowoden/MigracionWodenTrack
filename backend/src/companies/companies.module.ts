import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // Importante para la DB
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { Company } from './entities/company.entity'; // Tu entidad de SQL Server
import { OdooModule } from '../odoo/odoo.module';

@Module({
  imports: [
    // 1. Registramos la entidad para que el repositorio esté disponible
    TypeOrmModule.forFeature([Company]), 
    // 2. Mantenemos OdooModule para la sincronización
    OdooModule,
  ],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  // 3. Opcional: exportarlo si otros módulos lo necesitan
  exports: [CompaniesService],
})
export class CompaniesModule {}