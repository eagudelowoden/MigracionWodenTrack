import { Body, Controller, Get, Post } from '@nestjs/common';
import { SistemaConfigService } from './sistema-config.service';

@Controller('usuarios/sistema-config')
export class SistemaConfigController {
  constructor(private readonly svc: SistemaConfigService) {}

  @Get()
  async getAll() {
    return this.svc.getAll();
  }

  @Post()
  async update(@Body() body: { updates: Record<string, string>; updatedBy?: string }) {
    await this.svc.setBulk(body.updates, body.updatedBy);
    return { ok: true };
  }
}
