// src/odoo/odoo.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as v8 from 'v8';

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

  /**
   * search_read paginado con progreso real.
   * Llama a search_count primero y emite onProgress(fetched, total) tras cada página.
   */
  public async searchReadAllWithProgress<T>(
    model: string,
    domain: any[],
    fields: string[],
    uid: number,
    onProgress: (fetched: number, total: number) => void,
    pageSize = 5000,
  ): Promise<T[]> {
    const total = await this.executeKw<number>(model, 'search_count', [domain], {}, uid);
    onProgress(0, total);

    const results: T[] = [];
    let offset = 0;

    // Umbral DINÁMICO relativo al heap REAL del proceso (respeta el
    // --max-old-space-size efectivo). Abortamos al 55% porque el pico REAL no
    // es la descarga sino el PROCESAMIENTO posterior (agrupar + mapear cédulas),
    // donde la memoria casi se duplica: mantiene los arrays crudos mientras
    // construye la estructura agrupada. Cortar la descarga al 55% deja ~45% de
    // headroom para esa fase y evita el OOM (lanza un error CONTROLADO que el
    // stream envía al cliente, en vez de que el proceso muera).
    const heapLimit = v8.getHeapStatistics().heap_size_limit;
    const umbralBytes = Math.floor(heapLimit * 0.55);

    while (true) {
      const chunk = await this.executeKw<T[]>(
        model, 'search_read', [domain],
        { fields, limit: pageSize, offset },
        uid,
      );
      if (!chunk || chunk.length === 0) break;
      results.push(...chunk);
      onProgress(results.length, total);

      if (process.memoryUsage().heapUsed > umbralBytes) {
        const usadoMb = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
        const limiteMb = Math.round(heapLimit / 1024 / 1024);
        throw new InternalServerErrorException(
          `Consulta demasiado grande: se alcanzó el límite de memoria ` +
            `(${usadoMb} MB de ${limiteMb} MB) al cargar ${model} ` +
            `(${results.length}/${total} registros). Reduce el rango de fechas ` +
            `o agrega un filtro de departamento/área e intenta de nuevo.`,
        );
      }

      if (chunk.length < pageSize) break;
      offset += pageSize;
    }
    return results;
  }

  /**
   * search_read paginado que NUNCA materializa el resultado completo: cada
   * página de `pageSize` se entrega a `onPage` y se descarta (no se acumula
   * en un array interno). Úsalo cuando el llamador va a agregar/indexar cada
   * página en su propia estructura (evita mantener dos copias del dataset
   * completo en memoria a la vez). Devuelve el total de registros procesados.
   */
  public async searchReadAllStream<T>(
    model: string,
    domain: any[],
    fields: string[],
    uid: number,
    onPage: (chunk: T[]) => void | Promise<void>,
    pageSize = 5000,
  ): Promise<number> {
    const HEAP_LIMIT_BYTES = 1.2 * 1024 * 1024 * 1024;
    let offset = 0;
    let totalFetched = 0;

    while (true) {
      const chunk = await this.executeKw<T[]>(
        model, 'search_read', [domain],
        { fields, limit: pageSize, offset },
        uid,
      );
      if (!chunk || chunk.length === 0) break;
      await onPage(chunk);
      totalFetched += chunk.length;

      if (process.memoryUsage().heapUsed > HEAP_LIMIT_BYTES) {
        throw new InternalServerErrorException(
          `Consulta abortada: uso de memoria excesivo al cargar ${model} ` +
            `(${totalFetched} registros procesados). Reduce el rango de fechas o agrega filtros.`,
        );
      }

      if (chunk.length < pageSize) break;
      offset += pageSize;
    }
    return totalFetched;
  }

  /**
   * search_read paginado: obtiene TODOS los registros en chunks de `pageSize`.
   * Evita timeouts y límites artificiales en consultas grandes (1 mes, 400+ empleados).
   */
  public async searchReadAll<T>(
    model: string,
    domain: any[],
    fields: string[],
    uid: number,
    pageSize = 5000,
  ): Promise<T[]> {
    const results: T[] = [];
    let offset = 0;

    while (true) {
      const chunk = await this.executeKw<T[]>(
        model,
        'search_read',
        [domain],
        { fields, limit: pageSize, offset },
        uid,
      );

      if (!chunk || chunk.length === 0) break;
      results.push(...chunk);

      // Si devolvió menos que pageSize, ya no hay más páginas
      if (chunk.length < pageSize) break;
      offset += pageSize;
    }

    return results;
  }
}
