import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WfsmService {
  constructor(private readonly config: ConfigService) {}

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

  async getSerialesRecuperados(
    fecha: string,
    documento?: string,
  ): Promise<any[]> {
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
    if (documento) qs.push(`documento_identidad=${encodeURIComponent(documento)}`);

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
