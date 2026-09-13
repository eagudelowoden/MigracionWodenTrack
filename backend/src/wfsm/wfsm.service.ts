import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
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
  // WFS solo filtra por cédula del cliente (cliente/cedula); sin ese parámetro
  // devuelve el día completo (~24MB) y no admite filtro por agente. Para
  // no pegarle esa carga a su API en cada búsqueda, guardamos el día en la BD
  // (tabla wfsm_seriales_recuperados) y filtramos ahí con SQL. Si dos búsquedas
  // de la misma fecha llegan casi al tiempo y ninguna tiene datos frescos, la
  // segunda se "engancha" a la sincronización de la primera en vez de disparar
  // otra consulta de 20MB a WFS (cola de sincronización en memoria).
  private readonly SYNC_TTL_MS = 15 * 60 * 1000; // 15 min

  // Tope de filas devueltas por consulta. Cada fila arrastra su JSON completo
  // (~2.4 KB en la columna datos) y se parsea en memoria: 15 días sin filtros
  // son ~150.000 filas, es decir cientos de MB en el heap de una sola petición.
  // La vista pagina de a 50, así que 5.000 es holgado para el uso real.
  private readonly MAX_FILAS = 5000;
  private sincronizacionesEnCurso = new Map<string, Promise<void>>();

  // ── Modo de consulta ────────────────────────────────────────────────────────
  // WFSM_CONSULTA_DIRECTA:
  //   'auto'  (por defecto) → con cédula de cliente va directo a WFS; sin ella,
  //                           a la caché en BD. Es el reparto óptimo: WFS solo
  //                           filtra por cliente/cedula, y ahí responde en
  //                           ~0.4 s aunque el rango sea de 15 días. Sin cédula
  //                           devuelve el día completo (~24 MB), que es
  //                           justamente lo que la caché evita.
  //   'true'                → siempre directo a WFS.
  //   'false'               → siempre caché en BD.
  private get modoConfigurado(): string {
    return String(this.config.get('WFSM_CONSULTA_DIRECTA') ?? 'auto').toLowerCase();
  }

  private resolverModo(documento?: string): 'directo' | 'bd' {
    const modo = this.modoConfigurado;
    if (modo === 'true') return 'directo';
    if (modo === 'false') return 'bd';
    return documento?.trim() ? 'directo' : 'bd'; // auto
  }

  // Parámetro de cédula del CLIENTE que sí filtra en el servidor de WFS.
  // La API usa convención "espacio/campo" (igual que conf/timezone y
  // servicio/id_proyecto). Medido el 2026-09-12 sobre un día de 10.296
  // registros: sin filtro 24 MB en 8.6 s; con cliente/cedula, 0.00 MB en 0.36 s.
  // Nombres que WFS IGNORA (devuelven el día completo): documento_identidad,
  // documento, document, cedula, cedula_cliente, cliente/documento_identidad,
  // visita/cedula, agente/cedula, usuario/cedula, y los mismos en el body.
  // No existe equivalente para filtrar por agente: ese filtro es nuestro.
  private get paramDocumento(): string {
    return this.config.get<string>('WFSM_PARAM_DOCUMENTO') ?? 'cliente/cedula';
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

    // El campo "agente" acepta nombre o cédula: se prueba contra los dos.
    const ag = agente?.trim().toLowerCase();
    if (ag) {
      out = out.filter(
        (r) =>
          String(r.agente_campo ?? '').toLowerCase().includes(ag) ||
          String(r.documento_identidad ?? '').includes(ag),
      );
    }

    return out;
  }

  async getSerialesRecuperados(
    fechaInicio: string,
    fechaFin: string,
    documento?: string,
    agente?: string,
  ): Promise<{
    registros: any[];
    modo: string;
    total_api: number | null;
    sugerencia: string | null;
    sincronizado: boolean;
    truncado: boolean;
  }> {
    const dias = this.diasEntre(fechaInicio, fechaFin);
    const modo = this.resolverModo(documento);

    // Mensaje de ayuda cuando la búsqueda sale vacía. Hay dos casos distintos
    // y cada uno tiene una salida distinta:
    const sugerir = (n: number, modoUsado: 'directo' | 'bd') => {
      if (n !== 0) return null;

      // (a) No se filtró por cédula: es el único filtro que WFS resuelve en su
      // servidor, y el que hace viables los rangos largos (~0.4 s a 15 días).
      if (!documento?.trim()) {
        return 'Sin resultados en los datos ya almacenados. Intenta con el número de cédula del cliente: esa búsqueda va directo a la API y funciona incluso en rangos de 15 días.';
      }

      // (b) Sí hubo cédula y se consultó a WFS: la API exige el número exacto
      // (comprobado: una cédula a la que le faltan dos dígitos devuelve 0),
      // mientras que la búsqueda en caché sí admite coincidencias parciales.
      if (modoUsado === 'directo') {
        return 'Sin resultados. La API busca la cédula exacta, no parcial: verifica que el número esté completo.';
      }

      return 'Sin resultados para esa cédula en el rango consultado.';
    };

    // ── Modo directo: una sola llamada a WFS con todo el rango ───────────────
    if (modo === 'directo') {
      const crudos = await this.fetchRegistrosRango(dias[0], dias[dias.length - 1], documento);
      const todos = this.filtrarEnMemoria(crudos, documento, agente);
      const registros = todos.slice(0, this.MAX_FILAS);
      return {
        registros,
        modo: 'directo',
        total_api: crudos.length,
        sugerencia: sugerir(registros.length, 'directo'),
        sincronizado: true,
        truncado: todos.length > this.MAX_FILAS,
      };
    }

    // ── Modo BD ─────────────────────────────────────────────────────────────
    // Sin ningún filtro (ni cédula ni agente) se responde SOLO con lo que ya
    // está en caché, sin esperar a WFS: sincronizar cuesta ~8 s por día, y la
    // consulta sin filtros es justo la que más días suele abarcar. Con filtro
    // de agente sí se sincroniza, porque ahí el usuario busca algo concreto y
    // un vacío por caché fría sería engañoso.
    const sincronizar = !!agente?.trim();
    // En serie, no en paralelo: cada día son ~24MB desde WFS.
    if (sincronizar) {
      for (const dia of dias) await this.asegurarSincronizado(dia);
    }

    const qb = this.serialRepo
      .createQueryBuilder('s')
      .where('s.fecha BETWEEN :ini AND :fin', { ini: dias[0], fin: dias[dias.length - 1] });

    // Predicados sargables: un LIKE '%x%' descarta el índice y obliga a evaluar
    // fila por fila. Cuando lo buscado es numérico (el caso normal: cédulas) se
    // usa igualdad, que sí permite seek. Solo el nombre de agente conserva la
    // búsqueda por contenido, porque ahí la gente escribe un apellido suelto.
    const esNumerico = (v: string) => /^\d+$/.test(v);

    const doc = documento?.trim();
    if (doc) {
      // cedula_cliente no siempre es una cédula: también trae nombres de sede
      // ('CE CALI AVENTURA PLAZA'), de ahí las dos ramas.
      if (esNumerico(doc)) {
        qb.andWhere('s.cedula_cliente = :doc', { doc });
      } else {
        qb.andWhere('s.cedula_cliente LIKE :docPrefijo', { docPrefijo: `${doc}%` });
      }
    }

    const ag = agente?.trim();
    if (ag) {
      if (esNumerico(ag)) {
        // Cédula del agente: columna propia e indexada, igualdad exacta.
        qb.andWhere('s.documento_agente = :agDoc', { agDoc: ag });
      } else {
        // Nombre: se mantiene LIKE por contenido (se busca por apellido). No es
        // sargable, pero el rango de fechas ya acota las filas a evaluar.
        // Sin LOWER(): el collation de la base es SQL_Latin1_General_CP1_CI_AS
        // (CI = case-insensitive), así que la comparación ya ignora mayúsculas.
        // Envolver la columna en una función solo impedía usar el índice.
        qb.andWhere('s.agente_campo LIKE :agNombre', { agNombre: `%${ag}%` });
      }
    }

    // Orden explícito: sin él, al recortar quedarían filas arbitrarias. Se
    // ordena por fecha descendente (lo más reciente primero, que es lo que la
    // vista quiere mostrar) y por id para desempatar de forma estable.
    qb.orderBy('s.fecha', 'DESC').addOrderBy('s.id_visita', 'DESC');

    // Se pide una fila de más: si vuelve, es que había más de las permitidas.
    const filas = await qb.take(this.MAX_FILAS + 1).getMany();
    const truncado = filas.length > this.MAX_FILAS;
    if (truncado) filas.length = this.MAX_FILAS;
    return {
      registros: filas.map((f) => JSON.parse(f.datos)),
      modo: 'bd',
      total_api: null,
      sugerencia: sugerir(filas.length, 'bd'),
      sincronizado: sincronizar,
      truncado,
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

  // Sincroniza una fecha: trae el día entero de WFS y reemplaza en bloque lo
  // que hubiera (evita arrastrar registros obsoletos si un estatus cambió).
  //
  // No hay sincronización incremental posible. El parámetro
  // visita/min_actualizacion existe en la API y filtra de verdad, pero el campo
  // está casi siempre vacío: pedido el día 2026-09-12 desde el inicio de ese
  // mismo día devolvió 0 de 5.442 registros. Usarlo como marca de agua dejaría
  // los días incompletos para siempre (un día sincronizado a mediodía nunca
  // recibiría lo de la tarde). Por eso cada refresco baja el día completo.
  async sincronizarDia(fecha: string): Promise<void> {
    // El corte se toma ANTES de pedir, para no marcar como sincronizado un
    // instante posterior a los datos que realmente se trajeron.
    const inicio = new Date();
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
        // documento_identidad de WFS = cédula del agente (no del cliente).
        documento_agente: r.documento_identidad ?? null,
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

      await trx.upsert(WfsmSyncEstado, { fecha, ultima_sync_en: inicio }, ['fecha']);
    });

    console.log(`[WFSM] ${fecha} sincronizado: ${filas.length} registros`);
  }

  /** De las fechas dadas, cuáles ya tienen caché registrada. */
  async fechasConCache(fechas: string[]): Promise<Set<string>> {
    if (!fechas.length) return new Set();
    const filas = await this.syncEstadoRepo.find({ where: { fecha: In(fechas) } });
    return new Set(filas.map((f) => f.fecha));
  }

  // Borra de la caché lo más viejo que la retención. La tabla es caché, no
  // libro de registro: cualquier fecha se puede volver a traer de WFS.
  async purgarAntiguos(diasRetencion: number): Promise<number> {
    const corte = new Date(Date.now() - diasRetencion * 86400000)
      .toISOString()
      .split('T')[0];

    const res = await this.serialRepo
      .createQueryBuilder()
      .delete()
      .where('fecha < :corte', { corte })
      .execute();

    await this.syncEstadoRepo
      .createQueryBuilder()
      .delete()
      .where('fecha < :corte', { corte })
      .execute();

    return res.affected ?? 0;
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

    console.log(`[WFSM] Consulta ${fechaInicio}..${fechaFin}${doc ? ` doc=${doc}` : ''}`);

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
