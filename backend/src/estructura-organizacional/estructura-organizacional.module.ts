import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstructuraOrganizacionalService } from './estructura-organizacional.service';
import { EstructuraOrganizacionalController } from './estructura-organizacional.controller';
import { CentroCosto } from './entities/centro-costo.entity';
import { SegmentoEstructura } from './entities/segmento-estructura.entity';
import { SegmentacionArea } from './entities/segmentacion-area.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CentroCosto, SegmentoEstructura, SegmentacionArea, Usuario])],
  controllers: [EstructuraOrganizacionalController],
  providers: [EstructuraOrganizacionalService],
  exports: [EstructuraOrganizacionalService],
})
export class EstructuraOrganizacionalModule {}
