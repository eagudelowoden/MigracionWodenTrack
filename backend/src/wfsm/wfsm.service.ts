import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WfsmService {
  constructor(private readonly config: ConfigService) {}

  async getSerialesRecuperados(
    fecha: string,
    documento?: string,
  ): Promise<any[]> {
    const loginUrl = this.config.get<string>('WFSM_LOGIN_URL');
    const authBasic = this.config.get<string>('WFSM_AUTH_BASIC');
    const consultaUrl = this.config.get<string>(
      'WFSM_CONSULTA_SERIALES_RECUPERADOS_URL',
    );

    if (!loginUrl || !authBasic || !consultaUrl) {
      throw new Error(
        'Variables de entorno WFSM no configuradas en el servidor.',
      );
    }

    // 1. Login con Basic Auth → obtener token
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
      throw new Error(
        `Login WFS fallido (${loginRes.status}): ${body}`,
      );
    }

    const loginData = await loginRes.json();
    console.log('[WFSM] Login response keys:', Object.keys(loginData));

    // El campo puede llamarse "token", "access_token", "api_key", etc.
    const token =
      loginData.token ??
      loginData.access_token ??
      loginData.api_key ??
      loginData.key ??
      null;

    if (!token) {
      throw new Error(
        `Token WFS no encontrado. Respuesta login: ${JSON.stringify(loginData)}`,
      );
    }

    // 2. Rango de fechas Colombia UTC-5
    const [y, m, d] = fecha.split('-').map(Number);
    const nextDay = new Date(Date.UTC(y, m - 1, d + 1))
      .toISOString()
      .split('T')[0];

    const params = new URLSearchParams({
      'visita/min_recepcion': `${fecha}T00:00:00.000Z`,
      'visita/max_recepcion': `${nextDay}T04:59:59.000Z`,
      'conf/timezone': '300',
      'servicio/id_proyecto': '1',
    });
    if (documento) params.set('documento_identidad', documento);

    const consultaFullUrl = `${consultaUrl}?${params.toString()}`;
    console.log('[WFSM] Consultando:', consultaFullUrl);

    // 3. Consulta con el token como api key en Authorization
    const consultaRes = await fetch(consultaFullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: token,
      },
    });

    if (!consultaRes.ok) {
      const body = await consultaRes.text().catch(() => '');
      throw new Error(
        `Consulta WFS fallida (${consultaRes.status}): ${body}`,
      );
    }

    const data = await consultaRes.json();
    console.log('[WFSM] Respuesta keys:', Object.keys(data));
    return data?.registros ?? (Array.isArray(data) ? data : []);
  }
}
