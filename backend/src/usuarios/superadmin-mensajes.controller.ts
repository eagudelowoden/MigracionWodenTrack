import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { SuperAdminMensajesService, DestinatarioItem } from './superadmin-mensajes.service';

@Controller('usuarios/superadmin/mensajes')
export class SuperAdminMensajesController {
  constructor(private readonly svc: SuperAdminMensajesService) {}

  // ── Destinatarios ────────────────────────────────────────────
  @Get('destinatarios')
  getDestinatarios() {
    return this.svc.getDestinatarios();
  }

  @Post('destinatarios')
  addDestinatario(@Body() body: DestinatarioItem) {
    return this.svc.addDestinatario(body);
  }

  @Delete('destinatarios/:idOdoo')
  removeDestinatario(@Param('idOdoo', ParseIntPipe) idOdoo: number) {
    return this.svc.removeDestinatario(idOdoo);
  }

  // ── Historial ────────────────────────────────────────────────
  @Get('historial')
  getHistorial(
    @Query('de') de: string,
    @Query('para') para: string,
    @Query('limit') limit: string,
  ) {
    return this.svc.getHistorial(
      de ? +de : null,
      para ? +para : null,
      limit ? +limit : 50,
    );
  }

  @Post('marcar-leidos')
  marcarLeidos(@Body() body: { mensajeIds: number[] }) {
    return this.svc.marcarLeidos(body.mensajeIds);
  }

  @Get('no-leidos/:idOdoo')
  noLeidos(@Param('idOdoo', ParseIntPipe) idOdoo: number) {
    return this.svc.getNoLeidos(idOdoo);
  }
}
