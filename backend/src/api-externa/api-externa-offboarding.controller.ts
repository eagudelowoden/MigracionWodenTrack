// Endpoint público: checklist de IT del proceso de offboarding (Paz y Salvo).
// Usa las MISMAS credenciales Bearer que el resto de la API externa.
import { Controller, Get, Post, Body, Query, Req, Res, HttpCode, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Public } from '../auth/public.decorator';
import { ApiExternaService } from './api-externa.service';
import { ApiExternaOffboardingService } from './api-externa-offboarding.service';

// @Public exime del JwtAuthGuard global, que exige el JWT de la app. No deja
// el endpoint abierto: la autenticación es el Bearer de API Externa, validado
// en cada método con validateToken().
@Public()
@Controller('usuarios/api-externa/offboarding')
export class ApiExternaOffboardingController {
  constructor(
    private readonly auth: ApiExternaService,
    private readonly svc: ApiExternaOffboardingService,
  ) {}

  private addCors(res: Response) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type');
    // Sin esto el cliente puede quedarse con un 304 y servir una respuesta
    // vieja: el estado del offboarding cambia todo el tiempo y un "total: 0"
    // cacheado haría creer que la persona no está en proceso.
    res.setHeader('Cache-Control', 'no-store');
  }

  /** Limpia un parámetro de texto: los clientes suelen mandar espacios. */
  private limpiar(v?: string): string | undefined {
    const t = String(v ?? '').trim();
    return t || undefined;
  }

  /** Valida el Bearer y devuelve la credencial, o null si no sirve. */
  private async credencial(req: Request) {
    const header = req.headers['authorization'] ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    return this.auth.validateToken(token);
  }

  // ─── GET /offboarding/checklist-it ────────────────────────────────────────
  // Las preguntas que el sistema externo debe mostrar y responder.
  @Get('checklist-it')
  async checklist(@Req() req: Request, @Res() res: Response) {
    this.addCors(res);
    if (!(await this.credencial(req))) {
      return res.status(401).json({ ok: false, error: 'Token inválido o credencial inactiva.' });
    }

    const preguntas = await this.svc.preguntas();
    return res.json({
      ok: true,
      modulo: 'it',
      total: preguntas.length,
      preguntas: preguntas.map((p) => ({ id: p.id, texto: p.texto, orden: p.orden })),
    });
  }

  // ─── GET /offboarding/pendientes ──────────────────────────────────────────
  @Get('pendientes')
  async pendientes(
    @Query('cedula') cedula: string,
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    this.addCors(res);
    if (!(await this.credencial(req))) {
      return res.status(401).json({ ok: false, error: 'Token inválido o credencial inactiva.' });
    }

    const data = await this.svc.pendientes({
      cedula: this.limpiar(cedula),
      fechaInicio: this.limpiar(fechaInicio),
      fechaFin: this.limpiar(fechaFin),
    });
    return res.json({ ok: true, total: data.length, data });
  }

  // ─── POST /offboarding/it ─────────────────────────────────────────────────
  // Guarda las respuestas del checklist de IT.
  @Post('it')
  @HttpCode(HttpStatus.OK)
  async responderIT(
    @Body() body: { cedula?: string; respuestas?: Record<string, boolean>; por?: string },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    this.addCors(res);
    const cred = await this.credencial(req);
    if (!cred) {
      return res.status(401).json({ ok: false, error: 'Token inválido o credencial inactiva.' });
    }

    const cedula = String(body?.cedula ?? '').trim();
    if (!cedula) {
      return res.status(400).json({ ok: false, error: 'Campo requerido: cedula' });
    }

    const respuestas = body?.respuestas;
    if (!respuestas || typeof respuestas !== 'object' || Array.isArray(respuestas)) {
      return res.status(400).json({
        ok: false,
        error: 'Campo requerido: respuestas. Objeto { "<idPregunta>": true|false }',
      });
    }
    if (!Object.keys(respuestas).length) {
      return res.status(400).json({ ok: false, error: 'respuestas no puede venir vacío.' });
    }
    const noBooleanos = Object.entries(respuestas)
      .filter(([, v]) => typeof v !== 'boolean')
      .map(([k]) => k);
    if (noBooleanos.length) {
      return res.status(400).json({
        ok: false,
        error: `Las respuestas deben ser true o false. Revisa: ${noBooleanos.join(', ')}`,
      });
    }

    // Queda registrado quién respondió: por defecto, el nombre de la credencial.
    const por = String(body?.por ?? '').trim() || `API · ${cred.nombre}`;
    const r = await this.svc.responderIT(cedula, respuestas, por);

    if (r.estado === 'sin_renuncia') {
      return res.status(404).json({
        ok: false,
        error: `No hay una renuncia aprobada para la cédula ${cedula}.`,
      });
    }

    if (r.estado === 'sin_iniciar') {
      return res.status(409).json({
        ok: false,
        error:
          'El proceso de offboarding aún no ha sido iniciado en WodenTrack. Debe abrirse desde Consultas — Proceso de Offboarding antes de responder el checklist.',
        novedad_id: r.novedad_id,
      });
    }

    if (r.estado === 'preguntas_invalidas') {
      return res.status(400).json({
        ok: false,
        error: 'Hay ids de pregunta que no existen o están inactivos. Vuelve a consultar /checklist-it.',
        ids_invalidos: r.ids,
      });
    }

    return res.json({
      ok: true,
      paz_salvo_id: r.paz_salvo_id,
      respondidas: r.respondidas,
      total_preguntas: r.total_preguntas,
      // true cuando TODAS las preguntas de IT quedaron respondidas.
      modulo_completo: r.modulo_completo,
      // true cuando además SST y Capital Humano ya estaban completos.
      proceso_completo: r.proceso_completo,
      por,
    });
  }
}
