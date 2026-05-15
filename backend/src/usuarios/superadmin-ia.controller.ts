import { Controller, Get } from '@nestjs/common';
import { SuperAdminIAService } from './superadmin-ia.service';

@Controller('usuarios/superadmin/ia')
export class SuperAdminIAController {
  constructor(private readonly svc: SuperAdminIAService) {}

  @Get('scores')
  getScores() {
    return this.svc.getScoresRiesgo();
  }

  @Get('tendencias')
  getTendencias() {
    return this.svc.getTendencias12Meses();
  }

  @Get('ranking')
  getRanking() {
    return this.svc.getRankingMes();
  }
}
