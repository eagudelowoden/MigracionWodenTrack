import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { OdooModule } from '../odoo/odoo.module';

@Module({
  imports: [TypeOrmModule.forFeature([]), OdooModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}