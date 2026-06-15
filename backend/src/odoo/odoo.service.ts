// src/odoo/odoo.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Cliente Odoo vía JSON-RPC (POST /jsonrpc).
 *
 * Reemplaza al antiguo transporte XML-RPC. JSON-RPC transfiere bastante
 * menos bytes y se parsea mucho más rápido en Node, lo que acelera de
 * forma notable las consultas grandes (lista de empleados, asistencias).
 *
 * Mantiene EXACTAMENTE la misma interfaz pública (`authenticate` y
 * `executeKw`) para que ningún servicio consumidor tenga que cambiar.
 *
 * Bonus: `fetch` en Node (undici) reutiliza conexiones automáticamente
 * (keep-alive), así que también evitamos el handshake TLS por llamada.
 */
@Injectable()
export class OdooService {
  private readonly endpoint: string;
  private readonly db: string;
  private readonly user: string;
  private readonly pass: string;

  private _cachedUid: number | null = null;
  private _uidExpiry = 0;

  // Timeout generoso: las consultas de asistencias pueden devolver miles de filas
  private readonly REQUEST_TIMEOUT_MS = 120_000;

  constructor(private readonly config: ConfigService) {
    const url = (this.config.get<string>('ODOO_URL') || '').replace(/\/+$/, '');
    this.endpoint = `${url}/jsonrpc`;
    this.db = this.config.get<string>('ODOO_DB') || '';
    this.user = this.config.get<string>('ODOO_USER') || '';
    this.pass = this.config.get<string>('ODOO_PASS') || '';
  }

  /**
   * Llamada JSON-RPC genérica a /jsonrpc.
   * Estructura: { jsonrpc, method: 'call', params: { service, method, args }, id }
   */
  private async jsonRpcCall<T>(
    service: 'common' | 'object',
    method: string,
    args: any[],
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: { service, method, args },
          id: Math.floor(Math.random() * 1_000_000_000),
        }),
        signal: controller.signal,
      });
    } catch (err: any) {
      clearTimeout(timer);
      const motivo =
        err?.name === 'AbortError' ? 'timeout' : (err?.message ?? 'desconocido');
      throw new InternalServerErrorException(
        `Error de conexión con Odoo (${service}.${method}): ${motivo}`,
      );
    }
    clearTimeout(timer);

    if (!response.ok) {
      throw new InternalServerErrorException(
        `Odoo respondió HTTP ${response.status} en ${service}.${method}`,
      );
    }

    const payload: any = await response.json();

    // En JSON-RPC los errores de Odoo llegan con HTTP 200 y un campo "error"
    if (payload.error) {
      const msg =
        payload.error?.data?.message ||
        payload.error?.message ||
        'Error desconocido de Odoo';
      throw new InternalServerErrorException(`Error Odoo ${service}.${method}: ${msg}`);
    }

    return payload.result as T;
  }

  /** Autentica y cachea el uid 30 minutos (misma semántica que antes). */
  public async authenticate(): Promise<number> {
    if (this._cachedUid && Date.now() < this._uidExpiry) {
      return this._cachedUid;
    }

    const uid = await this.jsonRpcCall<number>('common', 'login', [
      this.db,
      this.user,
      this.pass,
    ]);

    if (!uid) {
      throw new InternalServerErrorException('Error Odoo Auth: credenciales inválidas');
    }

    this._cachedUid = uid;
    this._uidExpiry = Date.now() + 30 * 60 * 1000; // 30 min
    return uid;
  }

  /**
   * Ejecuta cualquier método de un modelo Odoo (search_read, read_group, write…).
   * Firma idéntica a la versión XML-RPC para no romper a los consumidores.
   */
  public executeKw<T>(
    model: string,
    method: string,
    params: any[],
    options: any,
    uid: number,
  ): Promise<T> {
    return this.jsonRpcCall<T>('object', 'execute_kw', [
      this.db,
      uid,
      this.pass,
      model,
      method,
      params,
      options,
    ]);
  }
}
