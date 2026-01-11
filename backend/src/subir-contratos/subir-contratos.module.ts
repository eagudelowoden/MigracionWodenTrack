// subir-contratos.module.ts
import { Module } from '@nestjs/common';
import { SubirContratosController } from './subir-contratos.controller';

import { SubirContratosService } from './subir-contratos.service';
import { OdooModule } from '../odoo/odoo.module';

@Module({
  imports: [OdooModule],
  controllers: [SubirContratosController],
  providers: [SubirContratosService],
})
export class SubirContratosModule {}