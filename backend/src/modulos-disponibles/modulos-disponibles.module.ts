import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModuloDisponible } from './entities/modulo-disponible.entity';
import { ModulosDisponiblesService } from './modulos-disponibles.service';
import { ModulosDisponiblesController } from './modulos-disponibles.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ModuloDisponible])],
  controllers: [ModulosDisponiblesController],
  providers: [ModulosDisponiblesService],
  exports: [ModulosDisponiblesService],
})
export class ModulosDisponiblesModule {}
