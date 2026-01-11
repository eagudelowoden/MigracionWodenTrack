import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { OdooModule } from '../odoo/odoo.module'; // Importante

@Module({
  imports: [OdooModule], // Inyectamos el módulo de Odoo aquí
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}