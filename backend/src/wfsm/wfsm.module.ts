import { Module } from '@nestjs/common';
import { WfsmController } from './wfsm.controller';
import { WfsmService } from './wfsm.service';

@Module({
  controllers: [WfsmController],
  providers: [WfsmService],
})
export class WfsmModule {}
