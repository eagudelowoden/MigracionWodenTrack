import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WfsmController } from './wfsm.controller';
import { WfsmService } from './wfsm.service';
import { WfsmSerial } from './entities/wfsm-serial.entity';
import { WfsmSyncEstado } from './entities/wfsm-sync-estado.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WfsmSerial, WfsmSyncEstado])],
  controllers: [WfsmController],
  providers: [WfsmService],
})
export class WfsmModule {}
