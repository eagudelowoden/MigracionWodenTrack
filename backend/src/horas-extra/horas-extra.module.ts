import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { SchedulerRegistry } from '@nestjs/schedule';
import { memoryStorage } from 'multer';
import { HoraExtra } from './entities/hora-extra.entity';
import { HoraExtraCargue } from './entities/hora-extra-cargue.entity';
import { HoraExtraJob } from './entities/hora-extra-job.entity';
import { CalculadoExtra } from './entities/calculado-extra.entity';
import { CalculoExtraCronConfig } from './entities/calculo-extra-cron-config.entity';
import { MallaAsignacion } from '../mallas/entities/malla-asignacion.entity';
import { MallaHoraria } from '../mallas/entities/malla-horaria.entity';
import { MallaDetalle } from '../mallas/entities/malla-detalle.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { OdooModule } from '../odoo/odoo.module';
import { MailModule } from '../logsEmail/mail.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { HorasExtraService } from './horas-extra.service';
import { HorasExtraJobService } from './horas-extra-job.service';
import { HorasExtraCronService } from './horas-extra-cron.service';
import { HorasExtraController } from './horas-extra.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      HoraExtra,
      HoraExtraCargue,
      HoraExtraJob,
      CalculadoExtra,
      CalculoExtraCronConfig,
      MallaAsignacion,
      MallaHoraria,
      MallaDetalle,
      Usuario,
    ]),
    MulterModule.register({ storage: memoryStorage() }),
    OdooModule,
    MailModule,
    UsuariosModule,
  ],
  controllers: [HorasExtraController],
  providers: [
    HorasExtraService,
    HorasExtraJobService,
    HorasExtraCronService,
    SchedulerRegistry,
  ],
  exports: [HorasExtraService, HorasExtraJobService, HorasExtraCronService],
})
export class HorasExtraModule {}
