import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { HoraExtra } from './entities/hora-extra.entity';
import { HoraExtraCargue } from './entities/hora-extra-cargue.entity';
import { MallaAsignacion } from '../mallas/entities/malla-asignacion.entity';
import { MallaHoraria } from '../mallas/entities/malla-horaria.entity';
import { MallaDetalle } from '../mallas/entities/malla-detalle.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { OdooModule } from '../odoo/odoo.module';
import { MailModule } from '../logsEmail/mail.module';
import { HorasExtraService } from './horas-extra.service';
import { HorasExtraController } from './horas-extra.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      HoraExtra,
      HoraExtraCargue,
      MallaAsignacion,
      MallaHoraria,
      MallaDetalle,
      Usuario,
    ]),
    MulterModule.register({ storage: memoryStorage() }),
    OdooModule,
    MailModule,
  ],
  controllers: [HorasExtraController],
  providers: [HorasExtraService],
})
export class HorasExtraModule {}
