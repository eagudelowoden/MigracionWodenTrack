import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { NovedadesController } from './novedades.controller';
import { NovedadesService } from './novedades.service';
import { Novedad } from './entities/novedad.entity';
import { NovedadEstadoCh } from './entities/novedad-estado-ch.entity';
import { NovedadArchivo } from './entities/novedad-archivo.entity';
import { SistemaConfigModule } from '../sistema-config/sistema-config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Novedad, NovedadEstadoCh, NovedadArchivo]),
    MulterModule.register({ storage: memoryStorage() }),
    SistemaConfigModule,
  ],
  controllers: [NovedadesController],
  providers: [NovedadesService],
})
export class NovedadesModule {}
