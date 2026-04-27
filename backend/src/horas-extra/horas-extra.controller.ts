import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { HorasExtraService } from './horas-extra.service';

@Controller('usuarios/horas-extra')
export class HorasExtraController {
  constructor(private readonly service: HorasExtraService) {}

  @Post('calcular')
  calcular(
    @Body()
    dto: {
      startDate?: string;
      endDate?: string;
      soloHoy?: boolean;
      company?: string;
      calculado_por?: string;
    },
  ) {
    return this.service.calcularExtras({ ...dto, guardar: false });
  }

  @Post('guardar')
  guardar(
    @Body()
    dto: {
      startDate?: string;
      endDate?: string;
      soloHoy?: boolean;
      company?: string;
      calculado_por?: string;
    },
  ) {
    return this.service.calcularExtras({ ...dto, guardar: true });
  }

  @Get('historial')
  historial(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('company') company?: string,
    @Query('cedula') cedula?: string,
    @Query('soloConExtras') soloConExtras?: string,
  ) {
    return this.service.getHistorial({
      startDate,
      endDate,
      company,
      cedula,
      soloConExtras: soloConExtras === 'true',
    });
  }
}
