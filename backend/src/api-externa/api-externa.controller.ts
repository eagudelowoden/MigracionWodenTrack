// Endpoint público: autenticación + consulta de asistencias
import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiExternaService } from './api-externa.service';

@Controller('usuarios/api-externa')
export class ApiExternaController {
  constructor(private readonly svc: ApiExternaService) {}

  // CORS permisivo para cualquier cliente externo
  private addCors(res: Response) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type');
  }

  // ─── OPTIONS preflight ────────────────────────────────────────────────────
  @Get('asistencias')
  async asistenciasGet(
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
    @Query('cedula') cedula: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.handleAsistencias(fechaInicio, fechaFin, cedula, req, res);
  }

  // ─── POST /api-externa/auth ────────────────────────────────────────────────
  @Post('auth')
  @HttpCode(HttpStatus.OK)
  async auth(
    @Body() body: { username: string; password: string },
    @Res() res: Response,
  ) {
    this.addCors(res);
    const result = await this.svc.login(body.username, body.password);
    if (!result) {
      return res.status(401).json({
        ok: false,
        error: 'Credenciales inválidas',
      });
    }
    return res.json({
      ok: true,
      token: result.token,
      nombre: result.nombre,
      tipo: 'Bearer',
    });
  }

  // ─── GET /api-externa/asistencias ─────────────────────────────────────────
  private async handleAsistencias(
    fechaInicio: string,
    fechaFin: string,
    cedula: string | undefined,
    req: Request,
    res: Response,
  ) {
    this.addCors(res);

    // Validar token Bearer
    const authHeader = req.headers['authorization'] ?? '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : '';

    const cred = await this.svc.validateToken(token);
    if (!cred) {
      return res.status(401).json({
        ok: false,
        error: 'Token inválido o credencial inactiva.',
      });
    }

    // Validar fechas
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        ok: false,
        error:
          'Parámetros requeridos: fechaInicio (YYYY-MM-DD) y fechaFin (YYYY-MM-DD)',
      });
    }

    const reFecha = /^\d{4}-\d{2}-\d{2}$/;
    if (!reFecha.test(fechaInicio) || !reFecha.test(fechaFin)) {
      return res.status(400).json({
        ok: false,
        error: 'Formato de fecha inválido. Use YYYY-MM-DD',
      });
    }

    try {
      const data = await this.svc.getAsistencias(fechaInicio, fechaFin, cedula);
      return res.json({
        ok: true,
        total: data.length,
        fechaInicio,
        fechaFin,
        data,
      });
    } catch (err) {
      return res.status(500).json({
        ok: false,
        error:
          'Error al consultar asistencias. Intente con un rango de fechas más pequeño.',
      });
    }
  }
}
