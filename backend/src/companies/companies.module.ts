import { Module } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { OdooModule } from '../odoo/odoo.module'; // Asegúrate de que la ruta sea correcta

@Module({
  imports: [OdooModule], // Esto permite usar el OdooService aquí
  controllers: [CompaniesController],
  providers: [CompaniesService],
})
export class CompaniesModule {}