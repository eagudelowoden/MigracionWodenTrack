import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarcacionEcuador } from './entities/marcacion-ecuador.entity';
import { MarcacionEcuadorService } from './marcacion-ecuador.service';
import { MarcacionEcuadorController } from './marcacion-ecuador.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MarcacionEcuador])],
  controllers: [MarcacionEcuadorController],
  providers: [MarcacionEcuadorService],
  exports: [MarcacionEcuadorService],
})
export class MarcacionEcuadorModule {}
