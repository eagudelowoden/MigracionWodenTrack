// src/novedades/novedades.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { NovedadesController } from './novedades.controller';
import { NovedadesService } from './novedades.service';
import { Novedad } from './entities/novedad.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Novedad]), // ← esto le falta al tuyo
    MulterModule.register({ storage: memoryStorage() }),
  ],
  controllers: [NovedadesController],
  providers: [NovedadesService],
})
export class NovedadesModule {}
