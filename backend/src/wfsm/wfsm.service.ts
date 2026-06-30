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
    if (!loginRes.ok)
      throw new Error(`Login WFS fallido (${loginRes.status})`);
    const { token } = await loginRes.json();
    if (!token) throw new Error('Token WFS no recibido');

    // 2. Rango de fechas: Colombia UTC-5; el fin del día (23:59) equivale a
    //    04:59 del día siguiente en UTC, por eso se extiende hasta +1 día 04:59Z.
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

    // 3. Consulta con Token custom (esquema "Token <token>")
    const consultaRes = await fetch(`${consultaUrl}?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Token ${token}`,
      },
    });
    if (!consultaRes.ok)
      throw new Error(`Consulta WFS fallida (${consultaRes.status})`);

    const data = await consultaRes.json();
    return data?.registros ?? (Array.isArray(data) ? data : []);
  }
}
