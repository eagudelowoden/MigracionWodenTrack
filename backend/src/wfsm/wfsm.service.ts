import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WfsmSerial } from './entities/wfsm-serial.entity';
import { WfsmSyncEstado } from './entities/wfsm-sync-estado.entity';

@Injectable()
export class WfsmService {
  constructor(
    private readonly config: ConfigService,
    @InjectRepository(WfsmSerial)
    private readonly serialRepo: Repository<WfsmSerial>,
    @InjectRepository(WfsmSyncEstado)
    private readonly syncEstadoRepo: Repository<WfsmSyncEstado>,
  ) {}

  // ── Cache del token en memoria ─────────────────────────────────────────────
  // El login devuelve un token válido por bastante tiempo; en vez de pedir uno
  // nuevo en cada consulta lo reutilizamos hasta que expire (o falle la consulta).
  private tokenCache: { token: string; expira: number } | null = null;
  private readonly TOKEN_TTL_MS = 50 * 60 * 1000; // 50 min
  private loginEnCurso: Promise<string> | null = null;

  private async getToken(forzar = false): Promise<string> {
    if (
      !forzar &&
      this.tokenCache &&
      Date.now() < this.tokenCache.expira
    ) {
      return this.tokenCache.token;
    }

    // Si ya hay un login en curso, esperamos ese mismo (evita logins en paralelo)
    if (this.loginEnCurso) return this.loginEnCurso;

    this.loginEnCurso = this.doLogin().finally(() => {
      this.loginEnCurso = null;
    });
    return this.loginEnCurso;
  }

  private async doLogin(): Promise<string> {
    const loginUrl = this.config.get<string>('WFSM_LOGIN_URL');
    const authBasic = this.config.get<string>('WFSM_AUTH_BASIC');
    if (!loginUrl || !authBasic) {
      throw new Error('Variables de entorno WFSM_LOGIN_URL/WFSM_AUTH_BASIC no configuradas.');
    }

    const loginRes = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: authBasic,
      },
    });

    if (!loginRes.ok) {
      const body = await loginRes.text().catch(() => '');
      throw new Error(`Login WFS fallido (${loginRes.status}): ${body}`);
    }

    const loginData = await loginRes.json();
    const token =
      loginData.token ??
      loginData.access_token ??
      loginData.api_key ??
      loginData.key ??
      null;

    if (!token) {
      throw new Error(`Token WFS no encontrado. Respuesta login: ${JSON.stringify(loginData)}`);
    }

    this.tokenCache = { token, expira: Date.now() + this.TOKEN_TTL_MS };
    console.log('[WFSM] Nuevo token obtenido y cacheado.');
    return token;
  }

  // ── Persistencia en BD por día ──────────────────────────────────────────────
  // WFS ignora cualquier filtro de query string (comprobado: misma respuesta con
  // o sin documento_identidad) y siempre devuelve el día completo (~20MB). Para
  // no pegarle esa carga a su API en cada búsqueda, guardamos el día en la BD
  // (tabla wfsm_seriales_recuperados) y filtramos ahí con SQL. Si dos búsquedas
  // de la misma fecha llegan casi al tiempo y ninguna tiene datos frescos, la
  // segunda se "engancha" a la sincronización de la primera en vez de disparar
  // otra consulta de 20MB a WFS (cola de sincronización en memoria).
  private readonly SYNC_TTL_MS = 15 * 60 * 1000; // 15 min
  private sincronizacionesEnCurso = new Map<string, Promise<void>>();

  // ── Modo de consulta: directo a WFS vs BD ───────────────────────────────────
  // WFSM_CONSULTA_DIRECTA=true  → cada búsqueda pega a la API de WFS.
  // WFSM_CONSULTA_DIRECTA=false → se usa la caché en BD (comportamiento normal).
  // El camino de BD NO se elimina: el switch solo elige cuál se usa.
  private get consultaDirecta(): boolean {
    return String(this.config.get('WFSM_CONSULTA_DIRECTA') ?? '').toLowerCase() === 'true';
  }

  // Nombre del parámetro de documento que espera WFS. Se deja configurable
  // porque el que se probó antes (documento_identidad) era ignorado; si el
  // nuevo se llama distinto, se ajusta por entorno sin tocar código.
  private get paramDocumento(): string {
    return this.config.get<string>('WFSM_PARAM_DOCUMENTO') ?? 'documento_identidad';
  }

  // Días YYYY-MM-DD entre dos fechas, ambos extremos incluidos.
  private diasEntre(desde: string, hasta: string): string[] {
    const [y1, m1, d1] = desde.split('-').map(Number);
    const [y2, m2, d2] = hasta.split('-').map(Number);
    let ini = Date.UTC(y1, m1 - 1, d1);
    let fin = Date.UTC(y2, m2 - 1, d2);
    if (fin < ini) [ini, fin] = [fin, ini]; // rango invertido: se normaliza

    const dias: string[] = [];
    for (let t = ini; t <= fin; t += 86400000) {
      dias.push(new Date(t).toISOString().split('T')[0]);
    }
    return dias;
  }

  // Filtro aplicado siempre, también en modo directo: si WFS ignora el
  // parámetro de documento, el resultado igual sale filtrado. Comparar
  // total_api contra total revela si WFS filtró de verdad o no.
  private filtrarEnMemoria(registros: any[], documento?: string, agente?: string): any[] {
    let out = registros;

    const doc = documento?.trim();
    if (doc) out = out.filter((r) => String(r.cedula_cliente ?? '').includes(doc));

    const ag = agente?.trim().toLowerCase();
    if (ag) out = out.filter((r) => String(r.agente_campo ?? '').toLowerCase().includes(ag));

    return out;
  }

  async getSerialesRecuperados(
    fechaInicio: string,
    fechaFin: string,
    documento?: string,
    agente?: string,
  ): Promise<{ registros: any[]; modo: string; total_api: number | null }> {
    const dias = this.diasEntre(fechaInicio, fechaFin);

    // ── Modo directo: una sola llamada a WFS con todo el rango ───────────────
    if (this.consultaDirecta) {
      const crudos = await this.fetchRegistrosRango(dias[0], dias[dias.length - 1], documento);
      return {
        registros: this.filtrarEnMemoria(crudos, documento, agente),
        modo: 'directo',
        total_api: crudos.length,
      };
    }

    // ── Modo BD: se sincroniza día por día y se filtra con SQL ───────────────
    // En serie, no en paralelo: cada día son ~20MB desde WFS.
    for (const dia of dias) await this.asegurarSincronizado(dia);

    const qb = this.serialRepo
      .createQueryBuilder('s')
      .where('s.fecha BETWEEN :ini AND :fin', { ini: dias[0], fin: dias[dias.length - 1] });

    const doc = documento?.trim();
    if (doc) qb.andWhere('s.cedula_cliente LIKE :doc', { doc: `%${doc}%` });

    const ag = agente?.trim();
    if (ag) qb.andWhere('LOWER(s.agente_campo) LIKE :ag', { ag: `%${ag.toLowerCase()}%` });

    const filas = await qb.getMany();
    return {
      registros: filas.map((f) => JSON.parse(f.datos)),
      modo: 'bd',
      total_api: null,
    };
  }

  private async asegurarSincronizado(fecha: string): Promise<void> {
    const enCurso = this.sincronizacionesEnCurso.get(fecha);
    if (enCurso) return enCurso;

    const estado = await this.syncEstadoRepo.findOne({ where: { fecha } });
    if (estado && Date.now() - estado.ultima_sync_en.getTime() < this.SYNC_TTL_MS) {
      return; // datos ya frescos en BD
    }

    const promesa = this.sincronizarDia(fecha).finally(() => {
      this.sincronizacionesEnCurso.delete(fecha);
    });

    this.sincronizacionesEnCurso.set(fecha, promesa);
    return promesa;
  }

  // Trae el día completo de WFS y reemplaza en bloque lo que había en BD para
  // esa fecha (evita arrastrar registros obsoletos si un estatus cambió).
  private async sincronizarDia(fecha: string): Promise<void> {
    const registros = await this.fetchRegistrosRango(fecha, fecha);

    // WFS puede repetir el mismo id_visita más de una vez en el mismo día;
    // deduplicamos por id (nos quedamos con la última ocurrencia) para no
    // violar la llave primaria al guardar.
    const porId = new Map<number, any>();
    for (const r of registros) {
      const id = r.id_visita ?? r.key;
      if (id != null) porId.set(id, r);
    }

    const filas = Array.from(porId.entries()).map(([id, r]) =>
      this.serialRepo.create({
        id_visita: id,
        fecha,
        cedula_cliente: r.cedula_cliente ?? null,
        agente_campo: r.agente_campo ?? null,
        estatus: r.estatus ?? null,
        comprobante_link: r.comprobante_cliente ?? r.imagen_comprobante ?? null,
        datos: JSON.stringify(r),
      }),
    );

    // SQL Server admite ~2100 parámetros por consulta; con miles de filas hay
    // que insertar en lotes para no exceder ese límite.
    const LOTE = 200;

    await this.serialRepo.manager.transaction(async (trx) => {
      await trx.delete(WfsmSerial, { fecha });
      // upsert (no insert/save) por si un id_visita ya existía bajo otra fecha
      // (ej. un registro que WFS reclasificó de día tras un reintento).
      for (let i = 0; i < filas.length; i += LOTE) {
        await trx.upsert(WfsmSerial, filas.slice(i, i + LOTE), ['id_visita']);
      }
      await trx.upsert(
        WfsmSyncEstado,
        { fecha, ultima_sync_en: new Date() },
        ['fecha'],
      );
    });
  }

  private async fetchRegistrosRango(
    fechaInicio: string,
    fechaFin: string,
    documento?: string,
  ): Promise<any[]> {
    const consultaUrl = this.config.get<string>(
      'WFSM_CONSULTA_SERIALES_RECUPERADOS_URL',
    );
    if (!consultaUrl) {
      throw new Error('Variable de entorno WFSM_CONSULTA_SERIALES_RECUPERADOS_URL no configurada.');
    }

    // Rango de fechas Colombia UTC-5. El corte superior es el día siguiente
    // al último del rango a las 04:59Z, que es medianoche hora Colombia.
    const [y, m, d] = fechaFin.split('-').map(Number);
    const nextDay = new Date(Date.UTC(y, m - 1, d + 1))
      .toISOString()
      .split('T')[0];

    const qs: string[] = [
      `min_fecha=${encodeURIComponent(`${fechaInicio}T00:00:00.000Z`)}`,
      `max_fecha=${encodeURIComponent(`${nextDay}T04:59:59.000Z`)}`,
      `conf/timezone=300`,
      `servicio/id_proyecto=1`,
    ];

    // Parámetro de documento recién habilitado por WFS. Se envía solo si viene
    // con valor; si WFS lo sigue ignorando, filtrarEnMemoria() lo cubre.
    const doc = documento?.trim();
    if (doc) qs.push(`${this.paramDocumento}=${encodeURIComponent(doc)}`);

    console.log(`[WFSM] Consulta directa ${fechaInicio}..${fechaFin}${doc ? ` doc=${doc}` : ''}`);

    const consultaFullUrl = `${consultaUrl}?${qs.join('&')}`;

    // Consulta reutilizando el token cacheado; si vuelve 401/403 el token
    // expiró → forzamos un login nuevo y reintentamos una sola vez.
    let data = await this.consultar(consultaFullUrl, await this.getToken());
    if (data === '__AUTH_EXPIRED__') {
      console.log('[WFSM] Token expirado, renovando y reintentando...');
      data = await this.consultar(consultaFullUrl, await this.getToken(true));
    }

    if (data === '__AUTH_EXPIRED__') {
      throw new Error('Consulta WFS fallida: autenticación rechazada tras renovar token.');
    }

    return data?.registros ?? (Array.isArray(data) ? data : []);
  }

  private async consultar(url: string, token: string): Promise<any> {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Token ${token}`,
      },
    });

    if (res.status === 401 || res.status === 403) {
      this.tokenCache = null; // invalidar cache
      return '__AUTH_EXPIRED__';
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Consulta WFS fallida (${res.status}): ${body}`);
    }

    return res.json();
  }
}
