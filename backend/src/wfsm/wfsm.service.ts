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

  async getSerialesRecuperados(
    fecha: string,
    documento?: string,
    agente?: string,
  ): Promise<any[]> {
    await this.asegurarSincronizado(fecha);

    const qb = this.serialRepo
      .createQueryBuilder('s')
      .where('s.fecha = :fecha', { fecha });

    const doc = documento?.trim();
    if (doc) qb.andWhere('s.cedula_cliente LIKE :doc', { doc: `%${doc}%` });

    const ag = agente?.trim();
    if (ag) qb.andWhere('LOWER(s.agente_campo) LIKE :ag', { ag: `%${ag.toLowerCase()}%` });

    const filas = await qb.getMany();
    return filas.map((f) => JSON.parse(f.datos));
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
    const registros = await this.fetchRegistrosDelDia(fecha);

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

  private async fetchRegistrosDelDia(fecha: string): Promise<any[]> {
    const consultaUrl = this.config.get<string>(
      'WFSM_CONSULTA_SERIALES_RECUPERADOS_URL',
    );
    if (!consultaUrl) {
      throw new Error('Variable de entorno WFSM_CONSULTA_SERIALES_RECUPERADOS_URL no configurada.');
    }

    // Rango de fechas Colombia UTC-5
    const [y, m, d] = fecha.split('-').map(Number);
    const nextDay = new Date(Date.UTC(y, m - 1, d + 1))
      .toISOString()
      .split('T')[0];

    const qs: string[] = [
      `min_fecha=${encodeURIComponent(`${fecha}T00:00:00.000Z`)}`,
      `max_fecha=${encodeURIComponent(`${nextDay}T04:59:59.000Z`)}`,
      `conf/timezone=300`,
      `servicio/id_proyecto=1`,
    ];

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
