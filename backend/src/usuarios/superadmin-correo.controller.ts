import { Controller, Get, Post, Body, Header } from '@nestjs/common';
import { SuperAdminCorreoService } from './superadmin-correo.service';

@Controller('usuarios/superadmin/correo')
export class SuperAdminCorreoController {
  constructor(private readonly svc: SuperAdminCorreoService) {}

  @Get('config')
  getConfig() {
    return this.svc.getConfig();
  }

  @Post('config')
  saveConfig(@Body() body: any) {
    const { updatedBy, ...rest } = body;
    return this.svc.saveConfig(rest, updatedBy || 'superadmin');
  }

  @Post('test')
  testConexion() {
    return this.svc.testConexion();
  }

  @Post('ausentismo')
  enviarAusentismo(@Body() body: any) {
    return this.svc.enviarAusentismo(body);
  }

  @Get('novedades-destinatarios')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Header('Pragma', 'no-cache')
  getDestinatariosNovedades() {
    return this.svc.getDestinatariosNovedades();
  }

  @Post('novedades-destinatarios')
  saveDestinatariosNovedades(@Body() body: { destinatarios: string[]; updatedBy?: string }) {
    return this.svc.saveDestinatariosNovedades(body.destinatarios, body.updatedBy || 'superadmin');
  }

  // ── Capital Humano ────────────────────────────────────────────
  @Get('capital-humano')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  getCapitalHumano() {
    return this.svc.getCapitalHumano();
  }

  @Post('capital-humano')
  saveCapitalHumano(@Body() body: { emails: string[]; updatedBy?: string }) {
    return this.svc.saveCapitalHumano(body.emails ?? [], body.updatedBy || 'superadmin');
  }

  // ── Coordinadores por departamento ────────────────────────────
  @Get('coordinadores')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  getCoordinadores() {
    return this.svc.getCoordinadores();
  }

  @Post('coordinadores')
  saveCoordinadores(@Body() body: { items: { email: string; segmento: string | null }[]; updatedBy?: string }) {
    return this.svc.saveCoordinadores(body.items ?? [], body.updatedBy || 'superadmin');
  }

  // ── Novedades — Renuncia ──────────────────────────────────────
  @Get('novedades-renuncia')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  getNovedadesRenuncia() {
    return this.svc.getNovedadesRenuncia();
  }

  @Post('novedades-renuncia')
  saveNovedadesRenuncia(@Body() body: { emails: string[]; updatedBy?: string }) {
    return this.svc.saveNovedadesRenuncia(body.emails ?? [], body.updatedBy || 'superadmin');
  }
}
