import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HoraExtra } from './entities/hora-extra.entity';
import { MallaAsignacion } from '../mallas/entities/malla-asignacion.entity';
import { MallaHoraria } from '../mallas/entities/malla-horaria.entity';
import { MallaDetalle } from '../mallas/entities/malla-detalle.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { OdooModule } from '../odoo/odoo.module';
import { HorasExtraService } from './horas-extra.service';
import { HorasExtraController } from './horas-extra.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      HoraExtra,
      MallaAsignacion,
      MallaHoraria,
      MallaDetalle,
      Usuario,
    ]),
    OdooModule,
  ],
  controllers: [HorasExtraController],
  providers: [HorasExtraService],
})
export class HorasExtraModule {}
