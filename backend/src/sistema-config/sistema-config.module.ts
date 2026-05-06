import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SistemaConfig } from './entities/sistema-config.entity';
import { SistemaConfigService } from './sistema-config.service';
import { SistemaConfigController } from './sistema-config.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SistemaConfig])],
  controllers: [SistemaConfigController],
  providers: [SistemaConfigService],
  exports: [SistemaConfigService],
})
export class SistemaConfigModule {}
