import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PazSalvoChecklist } from '../novedades/entities/paz-salvo-checklist.entity';
import { PazSalvoService } from '../novedades/paz-salvo.service';

/** Módulo expuesto. Los demás (sst, ch) siguen siendo solo internos. */
const MODULO = 'it';

/**
 * La pantalla guarda las respuestas con la llave `${modulo}_${idChecklist}`
 * (ver ConsultasView.vue: id: `${item.modulo}_${item.id}`), o sea "it_6".
 * Hacia afuera exponemos el id limpio de la pregunta ("6") y traducimos aquí:
 * si guardáramos con la llave cruda, la pantalla no reconocería la respuesta.
 */
const aLlaveInterna = (idPregunta: number | string) => `${MODULO}_${idPregunta}`;

export type ResultadoIT =
  | { estado: 'ok'; paz_salvo_id: number; modulo_completo: boolean; proceso_completo: boolean; respondidas: number; total_preguntas: number }
  | { estado: 'sin_renuncia' }
  | { estado: 'sin_iniciar'; novedad_id: number }
  | { estado: 'preguntas_invalidas'; ids: number[] };

/**
 * Lógica del endpoint externo de offboarding.
 *
 * Solo expone el checklist de IT: sst y ch se responden únicamente desde
 * WodenTrack. El guardado reutiliza PazSalvoService.actualizarModulo, el mismo
 * camino que usa la pantalla, para que ambos orígenes produzcan exactamente el
 * mismo estado (incluido el recálculo de proceso_completo).
 */
@Injectable()
export class ApiExternaOffboardingService {
  constructor(
    @InjectRepository(PazSalvoChecklist)
    private readonly checklistRepo: Repository<PazSalvoChecklist>,
    private readonly pazSalvo: PazSalvoService,
  ) {}

  /** Preguntas activas de IT, en el orden en que las muestra la pantalla. */
  async preguntas(): Promise<PazSalvoChecklist[]> {
    return this.checklistRepo.find({
      where: { modulo: MODULO, activo: true },
      order: { orden: 'ASC' },
    });
  }

  /**
   * Procesos de offboarding de renuncias aprobadas. Sin cédula devuelve todos
   * los que coincidan con el rango; el externo normalmente consulta uno.
   */
  async pendientes(filtros: { cedula?: string; fechaInicio?: string; fechaFin?: string }) {
    // La búsqueda es por LIKE: un espacio de más (ej. "%20123" en la URL) no
    // encuentra nada. Se limpia aquí también, no solo en el controlador.
    const filas = await this.pazSalvo.buscarRenuncias({
      cedula: filtros.cedula?.trim() || undefined,
      fechaInicio: filtros.fechaInicio?.trim() || undefined,
      fechaFin: filtros.fechaFin?.trim() || undefined,
    });

    return filas.map(({ novedad, pazSalvo }) => ({
      cedula: novedad.cedula,
      nombre: novedad.nombre ?? null,
      // cargo y departamento solo existen en paz_salvo: la novedad no los trae.
      cargo: pazSalvo?.cargo ?? null,
      departamento: pazSalvo?.departamento ?? null,
      fecha_renuncia: novedad.fechaInicio ?? null,
      novedad_id: novedad.id,
      paz_salvo_id: pazSalvo?.id ?? null,
      // iniciado=false significa que nadie ha abierto el proceso en WodenTrack:
      // responder IT devolverá 409 hasta que se inicie allá.
      iniciado: !!pazSalvo,
      it_completo: pazSalvo?.it_ok ?? false,
      it_respondido_por: pazSalvo?.it_por ?? null,
      it_fecha: pazSalvo?.it_fecha ?? null,
      proceso_completo: pazSalvo?.proceso_completo ?? false,
      respuestas_it: this.aFormatoExterno(this.parseItems(pazSalvo?.it_items ?? null)),
    }));
  }

  /** Guarda las respuestas de IT para la renuncia en proceso de esa cédula. */
  async responderIT(
    cedula: string,
    respuestas: Record<string, boolean>,
    por: string,
  ): Promise<ResultadoIT> {
    const filas = await this.pazSalvo.buscarRenuncias({ cedula: cedula.trim() });

    // buscarRenuncias usa LIKE: se exige coincidencia exacta de cédula para no
    // escribir sobre el proceso de otra persona cuyo documento la contenga.
    const exactas = filas.filter((f) => String(f.novedad.cedula).trim() === cedula.trim());
    if (!exactas.length) return { estado: 'sin_renuncia' };

    // buscarRenuncias ordena por fecha_inicio DESC → la primera es la vigente.
    const objetivo = exactas[0];
    if (!objetivo.pazSalvo) {
      return { estado: 'sin_iniciar', novedad_id: objetivo.novedad.id };
    }

    const preguntas = await this.preguntas();
    const validos = new Set(preguntas.map((p) => String(p.id)));

    // Un id desconocido casi siempre es un checklist desactualizado del lado
    // externo: se rechaza entero en vez de guardar a medias.
    const desconocidos = Object.keys(respuestas).filter((k) => !validos.has(String(k)));
    if (desconocidos.length) {
      return { estado: 'preguntas_invalidas', ids: desconocidos.map(Number) };
    }

    // Se fusiona con lo ya respondido: el externo puede mandar solo una parte
    // sin borrar lo que se haya contestado desde WodenTrack.
    const items = this.parseItems(objetivo.pazSalvo.it_items);
    for (const [k, v] of Object.entries(respuestas)) items[aLlaveInterna(k)] = !!v;

    // Mismo criterio que la pantalla: el módulo queda OK solo cuando todas las
    // preguntas activas tienen respuesta.
    const respondidas = preguntas.filter(
      (p) => items[aLlaveInterna(p.id)] !== undefined && items[aLlaveInterna(p.id)] !== null,
    ).length;
    const ok = preguntas.length > 0 && respondidas === preguntas.length;

    const guardado = await this.pazSalvo.actualizarModulo(
      objetivo.pazSalvo.id,
      MODULO,
      ok,
      por,
      items,
    );

    return {
      estado: 'ok',
      paz_salvo_id: guardado.id,
      modulo_completo: guardado.it_ok,
      proceso_completo: guardado.proceso_completo,
      respondidas,
      total_preguntas: preguntas.length,
    };
  }

  /** Quita el prefijo "it_" para que el externo vea el mismo id de /checklist-it. */
  private aFormatoExterno(items: Record<string, boolean>): Record<string, boolean> {
    const out: Record<string, boolean> = {};
    const prefijo = `${MODULO}_`;
    for (const [k, v] of Object.entries(items)) {
      out[k.startsWith(prefijo) ? k.slice(prefijo.length) : k] = v;
    }
    return out;
  }

  private parseItems(json: string | null): Record<string, boolean> {
    if (!json) return {};
    try {
      const v = JSON.parse(json);
      return v && typeof v === 'object' ? v : {};
    } catch {
      return {};
    }
  }
}
