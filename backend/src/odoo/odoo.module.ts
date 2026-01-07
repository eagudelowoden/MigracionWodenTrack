import { Module } from '@nestjs/common';
import { OdooService } from './odoo.service';

@Module({
  providers: [OdooService],
  exports: [OdooService], // <--- ESTO ES LO QUE HACE QUE 'authenticate' SEA VISIBLE
})
export class OdooModule {}