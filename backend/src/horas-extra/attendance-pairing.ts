/**
 * Algoritmo CANÓNICO de emparejamiento entrada/salida a partir de
 * marcaciones biométricas reales.
 *
 * Es la ÚNICA lógica del sistema responsable de decidir cuál marcación es
 * la entrada y cuál es la salida. NO recibe ni consulta la malla/jornada
 * programada en ningún punto — la malla representa lo programado, el
 * biométrico representa lo que realmente ocurrió. El flujo siempre es:
 *
 *   marcaciones → orden cronológico → construir par entrada/salida
 *   → (recién ahí) comparar contra malla → clasificar → redondear
 *
 * Se usa tanto para construir pares desde `attendance.log` como para
 * reconstruir un par de `hr.attendance` cuando este viene inválido o
 * incompleto — nunca se debe "adivinar" la entrada o salida buscando una
 * marcación cercana a la hora de la malla.
 */

// Duración máxima razonable de un turno. Un emparejamiento entrada→salida
// que supere esto es inválido: en realidad son la salida de un turno y la
// entrada de otro (p. ej. 05:00 madrugada + 22:00 noche = 17h imposibles de
// un solo turno).
export const MAX_TURNO_MS = 14 * 60 * 60 * 1000;

// Ventana de gap plausible entre una entrada y su salida del día calendario
// siguiente (turno que cruza medianoche): mínimo 3h (turno real más corto) y
// máximo 18h (evita emparejar con la entrada del turno nocturno del día
// después).
export const MIN_GAP_SALIDA_MS = 3 * 60 * 60 * 1000;
export const MAX_GAP_SALIDA_MS = 18 * 60 * 60 * 1000;

// Dos marcaciones a menos de este umbral se consideran el mismo evento físico
// duplicado (reintento de sincronización del dispositivo), no dos punches
// distintos.
export const DUPLICADO_MS = 60 * 1000;

// Duración mínima para que un par cuente como "trabajado" (evita pares de
// 0-1 segundo por doble-click/glitch del dispositivo).

export const DURACION_MINIMA_MS = 60 * 1000;

// Tolerancia para tratar una marca suelta (sin pareja, al final de las
// marcaciones libres de un día) como un reintento del cierre del período
// anterior en vez de como el inicio de un turno nuevo. Es una señal AUXILIAR
// que solo se evalúa cuando el llamador aporta el fin programado de la malla
// de ese día (`finTurnoMin`): si la marca suelta cae dentro de esta ventana
// respecto al fin programado, se interpreta como reintento; si no se aporta
// malla, o la marca está lejos del fin programado, esta regla no hace nada y
// se preserva el comportamiento existente (búsqueda de salida al día
// siguiente). Ver `buildAttendancePair` para el porqué de esta señal: sin
// ella, un turno diurno cerrado (07:00→17:00) seguido de un reintento de
// salida (17:11) es indistinguible, solo con timestamps, de un turno
// nocturno real que abre pocos minutos después de cerrar el diurno.
export const TOLERANCIA_MARCA_SUELTA_MS = 30 * 60 * 1000;

// Duración máxima plausible para el "turno" que formaría una marca suelta al
// cruzar con una salida del día calendario siguiente, cuando esa marca suelta
// viene DESPUÉS de un turno ya cerrado ese mismo día y hay malla disponible
// para contrastar. Por encima de esto (p. ej. 14h13m) es evidencia de que la
// marca suelta es ruido (doble scan, reintento tardío, etc.) y no el inicio
// de un turno nocturno real — un turno nocturno real cruzando medianoche cae
// muy por debajo de este umbral (ver `MIN_GAP_SALIDA_MS`/`MAX_GAP_SALIDA_MS`,
// que permiten hasta 18h porque cubren el caso SIN turno cerrado previo; acá
// el turno cerrado previo ya es evidencia fuerte de cuál es la jornada real).
export const UMBRAL_TURNO_LARGO_MS = 12 * 60 * 60 * 1000;

// Qué tan lejos puede caer una marca suelta (sin pareja) respecto al fin
// programado de la malla para seguir considerándose "la salida real del día,
// nada más que tarde" en vez de un evento desconectado del resto de la
// jornada. Deliberadamente más ancho que `TOLERANCIA_MARCA_SUELTA_MS` (que es
// para el reintento INMEDIATO de cierre): acá cubre una salida
// legítimamente tardía (p. ej. 32 min después de la hora de salida).
export const DISTANCIA_FIN_TURNO_SALIDA_MS = 2 * 60 * 60 * 1000;

/** Marcación biométrica cruda, ya resuelta a hora local además de UTC. */
export interface Punch {
  /** Fecha+hora en horario local 'YYYY-MM-DD HH:mm:ss'. */
  localTime: string;
  /** Fecha+hora cruda (UTC, tal como viene de Odoo) — se usa para ordenar y
   *  calcular duraciones sin depender del huso horario. */
  rawTime: string;
  /** Payload original de Odoo (para extraer nombre/departamento, etc). */
  log?: any;
}

export interface AttendancePairResult {
  checkIn: string; // rawTime
  checkOut: string | null; // rawTime, null si el par quedó incompleto
  entradaLog: any;
  /** rawTime de una marcación del día siguiente consumida como salida (si aplica). */
  salidaConsumida: string | null;
  /** true si no se encontró una salida plausible para la entrada elegida. */
  incompleto: boolean;
  /**
   * true si el día calendario de referencia tenía más de un período
   * candidato (p. ej. un turno diurno que cierra y luego una entrada nueva
   * esa misma noche). Se eligió el período MÁS RECIENTE como resultado; los
   * períodos anteriores no se pierden silenciosamente pero tampoco generan
   * una fila propia en el esquema actual (una fila por empleado+fecha) — se
   * señaliza aquí para trazabilidad/alerta.
   */
  ambiguo: boolean;
}

/** Suma un día calendario a una fecha 'YYYY-MM-DD' (sin componente de hora). */
export function addUnDia(fecha: string): string {
  const [a, m, d] = fecha.split('-').map(Number);
  const dt = new Date(a, m - 1, d + 1);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

/**
 * Elimina marcaciones duplicadas (mismo evento físico registrado más de una
 * vez, p. ej. por reintento de sincronización del dispositivo biométrico).
 * Requiere la lista ya ordenada cronológicamente por `rawTime`. Dos
 * marcaciones consecutivas a menos de `DUPLICADO_MS` se colapsan en una.
 */
export function dedupePunches(punches: Punch[]): Punch[] {
  if (punches.length <= 1) return punches;
  const resultado: Punch[] = [punches[0]];
  for (let i = 1; i < punches.length; i++) {
    const anterior = resultado[resultado.length - 1];
    const actual = punches[i];
    const gapMs =
      new Date(actual.rawTime).getTime() - new Date(anterior.rawTime).getTime();
    if (gapMs < DUPLICADO_MS) continue; // duplicado: se descarta
    resultado.push(actual);
  }
  return resultado;
}

interface Periodo {
  in: Punch;
  out: Punch | null;
}

/** Minutos desde medianoche de la parte de hora de un `localTime` 'YYYY-MM-DD HH:mm:ss'. */
function minutosDelDia(localTime: string): number {
  const hhmmss = localTime.split(' ')[1] ?? '00:00:00';
  const [h, m] = hhmmss.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Divide las marcaciones LIBRES de un día calendario en períodos completos,
 * emparejando por ALTERNANCIA cronológica (entrada, salida, entrada, salida…)
 * en vez de tomar ciegamente primera/última. Esto evita mezclar dos turnos
 * distintos del mismo día en un solo par (p. ej. un turno diurno que cierra
 * a las 21:55 y un turno nocturno que abre a las 22:04 el mismo día
 * calendario no deben combinarse en "primera marcación del día → última
 * marcación del día siguiente").
 *
 * Cada par (in, out) solo se considera un período completo si su duración es
 * < MAX_TURNO_MS; si no, la marcación `in` queda como período abierto (sin
 * salida ese día) y la siguiente marcación empieza un nuevo período.
 */
function dividirEnPeriodos(dayPunches: Punch[]): Periodo[] {
  const periodos: Periodo[] = [];
  let i = 0;

  while (i < dayPunches.length) {
    const actual = dayPunches[i];
    const siguiente = dayPunches[i + 1];

    if (siguiente) {
      const spanMs =
        new Date(siguiente.rawTime).getTime() -
        new Date(actual.rawTime).getTime();

      if (spanMs < MAX_TURNO_MS) {
        periodos.push({
          in: actual,
          out: spanMs >= DURACION_MINIMA_MS ? siguiente : null,
        });

        i += 2;
        continue;
      }
    }

    periodos.push({
      in: actual,
      out: null,
    });

    i += 1;
  }

  return fusionarPeriodosCerrados(periodos);
}

/**
 * Si TODOS los períodos del día quedaron CERRADOS (cada uno con entrada y
 * salida, ambas ese mismo día calendario), los fusiona en uno solo: entrada
 * = la más temprana, salida = la más tardía. Si el resultado no cabe como un
 * turno plausible (≥ MAX_TURNO_MS), o si algún período quedó ABIERTO (sin
 * salida ese día), no se toca nada.
 *
 * Por qué es correcto: un período que queda ABIERTO ese día es la única
 * señal legítima de un turno que cruza medianoche (su salida hay que
 * buscarla al día siguiente). Si, en cambio, el último período del día
 * cierra solo (tiene su propia salida ese mismo día), eso es evidencia de
 * que NO hay ningún turno nocturno en juego — todas las marcas del día
 * pertenecen a una misma jornada continua con pausas en el medio (almuerzo,
 * cambios de zona, reintentos del dispositivo), no a turnos distintos.
 *
 * Ejemplo real (el que motivó esta función — 6 marcas, 3 pares, todos
 * cerrados el mismo día):
 *   06:45, 09:30, 09:58, 12:00, 12:58, 16:31
 *   → alternancia: [(06:45→09:30), (09:58→12:00), (12:58→16:31)]
 *   → los tres cierran el mismo día → se fusionan → resultado: (06:45→16:31)
 *
 * Contraejemplo (NO debe fusionarse — hay un turno nocturno real):
 *   14:02, 21:55, 22:04 (+ 05:02 del día siguiente)
 *   → alternancia: [(14:02→21:55) cerrado, (22:04→…) ABIERTO ese día]
 *   → el último período no cierra solo → no se fusiona, se deja para
 *     resolverlo con la búsqueda de salida al día siguiente
 */
function fusionarPeriodosCerrados(periodos: Periodo[]): Periodo[] {
  if (periodos.length <= 1) return periodos;

  const todosCerrados = periodos.every((p) => p.out !== null);
  if (!todosCerrados) return periodos;

  const primero = periodos[0];
  const ultimo = periodos[periodos.length - 1];
  const spanTotalMs =
    new Date(ultimo.out!.rawTime).getTime() -
    new Date(primero.in.rawTime).getTime();
  if (spanTotalMs >= MAX_TURNO_MS) return periodos;

  return [{ in: primero.in, out: ultimo.out }];
}

/**
 * Función canónica: construye el par entrada/salida para `fecha` a partir de
 * TODAS las marcaciones reales de un empleado (varias fechas), ya ordenadas
 * cronológicamente. No consulta la malla en ningún momento.
 *
 * Reglas:
 *  - Se deduplican las marcaciones del día antes de procesar.
 *  - Se dividen en períodos por alternancia (ver `dividirEnPeriodos`).
 *  - Si hay más de un período, se toma el MÁS RECIENTE como resultado de
 *    esta fecha y se marca `ambiguo = true`.
 *  - Si el período elegido quedó sin salida (marcación impar / última del
 *    día), se busca la salida el día calendario siguiente con un gap
 *    plausible (MIN_GAP_SALIDA_MS – MAX_GAP_SALIDA_MS). Si no aparece, el
 *    par queda `incompleto = true` con `checkOut = null` — nunca se inventa.
 *  - Si no hay marcaciones libres ese día (todas ya consumidas por un turno
 *    anterior), devuelve `null`.
 *
 * `finTurnoMin` (opcional): minutos desde medianoche del fin programado de
 * la malla para `fecha`, si el empleado tiene una asignada. Se usa
 * ÚNICAMENTE como señal auxiliar para una situación puntual: un período
 * cerrado y plausible seguido de una única marca suelta sin pareja. Con solo
 * timestamps esa marca suelta es indistinguible entre "reintento del cierre"
 * (p. ej. 17:00→17:11 tras un turno 07:00→17:00) y "inicio de un turno
 * nocturno real" (p. ej. 21:55→22:04). Si la marca suelta está cerca del fin
 * programado de la malla, se trata como reintento; si no se aporta
 * `finTurnoMin`, esta señal no se evalúa y el comportamiento es idéntico al
 * de antes (se sigue buscando salida al día siguiente). La malla NUNCA
 * decide la entrada/salida en ningún otro punto de esta función.
 */
export function buildAttendancePair(
  fecha: string,
  todasLasMarcaciones: Punch[],
  consumidas: Set<string>,
  finTurnoMin?: number | null,
): AttendancePairResult | null {
  const dayPunchesRaw = todasLasMarcaciones.filter(
    (p) => p.localTime.split(' ')[0] === fecha && !consumidas.has(p.rawTime),
  );
  if (!dayPunchesRaw.length) return null;

  const dayPunches = dedupePunches(
    dayPunchesRaw.slice().sort((a, b) => a.rawTime.localeCompare(b.rawTime)),
  );
  const periodos = dividirEnPeriodos(dayPunches);
  let ambiguo = periodos.length > 1;
  let periodo = periodos[periodos.length - 1];

  // Marca suelta al final: período cerrado + una marca sin pareja próxima al
  // fin programado de la malla → reintento del cierre, no un turno nuevo.
  if (ambiguo && periodo.out === null && finTurnoMin != null) {
    const previo = periodos[periodos.length - 2];
    if (previo.out) {
      const gapMs =
        new Date(periodo.in.rawTime).getTime() -
        new Date(previo.out.rawTime).getTime();
      const distanciaFinTurnoMs =
        Math.abs(minutosDelDia(periodo.in.localTime) - finTurnoMin) * 60 * 1000;
      if (
        gapMs >= 0 &&
        gapMs < TOLERANCIA_MARCA_SUELTA_MS &&
        distanciaFinTurnoMs < TOLERANCIA_MARCA_SUELTA_MS
      ) {
        periodo = { in: previo.in, out: periodo.in };
        ambiguo = false;
      }
    }
  }

  if (periodo.out) {
    return {
      checkIn: periodo.in.rawTime,
      checkOut: periodo.out.rawTime,
      entradaLog: periodo.in.log,
      salidaConsumida: null,
      incompleto: false,
      ambiguo,
    };
  }

  // Período abierto: buscar la salida el día calendario siguiente.
  const siguiente = addUnDia(fecha);
  const entradaMs = new Date(periodo.in.rawTime).getTime();
  const salida = todasLasMarcaciones.find((p) => {
    if (p.localTime.split(' ')[0] !== siguiente) return false;
    if (consumidas.has(p.rawTime)) return false;
    const gapMs = new Date(p.rawTime).getTime() - entradaMs;
    return gapMs >= MIN_GAP_SALIDA_MS && gapMs <= MAX_GAP_SALIDA_MS;
  });

  // Marca suelta TARDÍA (no alcanza a ser "reintento de cierre" arriba) que
  // viene después de AL MENOS UN turno ya cerrado ese mismo día, con malla
  // disponible. Dos señales, en orden:
  //
  //  1) Si cruzando al día siguiente arma un turno de duración plausible
  //     (<= UMBRAL_TURNO_LARGO_MS), es un turno nocturno real: no se toca
  //     nada acá, se sigue con el comportamiento normal más abajo.
  //  2) Si no (no encuentra salida, o el cruce da un turno absurdamente
  //     largo), esta marca suelta es o bien la salida REAL del día (llegó
  //     tarde a la hora de salida) o ruido desconectado del resto de la
  //     jornada — se decide por su cercanía a `finTurnoMin`:
  //       - Cerca (<= DISTANCIA_FIN_TURNO_SALIDA_MS): es la salida real,
  //         tarde. Se fusiona TODA la jornada — primera entrada del día
  //         hasta esta marca — igual que haría `fusionarPeriodosCerrados`
  //         si esta marca hubiera cerrado con pareja.
  //       - Lejos: es ruido (doble scan sin relación, reintento tardío,
  //         etc.). Se descarta y queda el/los turno(s) YA CERRADOS de ese
  //         día (fusionados entre sí si hay más de uno).
  //     En ambos casos NUNCA se deja que esta marca le robe la entrada real
  //     del día siguiente (no se marca nada como consumido).
  if (ambiguo && finTurnoMin != null) {
    const cerrados = periodos.slice(0, -1);
    const ultimoCerrado = cerrados[cerrados.length - 1];
    if (ultimoCerrado?.out) {
      const duracionCruceMs = salida
        ? new Date(salida.rawTime).getTime() - entradaMs
        : null;
      const esNocturnoReal =
        duracionCruceMs !== null && duracionCruceMs <= UMBRAL_TURNO_LARGO_MS;

      if (!esNocturnoReal) {
        const primerCerrado = cerrados[0];
        const distanciaFinTurnoMs =
          Math.abs(minutosDelDia(periodo.in.localTime) - finTurnoMin) *
          60 *
          1000;
        const esSalidaTardia =
          distanciaFinTurnoMs <= DISTANCIA_FIN_TURNO_SALIDA_MS;

        return {
          checkIn: primerCerrado.in.rawTime,
          checkOut: esSalidaTardia
            ? periodo.in.rawTime
            : ultimoCerrado.out.rawTime,
          entradaLog: primerCerrado.in.log,
          salidaConsumida: null,
          incompleto: false,
          ambiguo: false,
        };
      }
    }
  }

  return {
    checkIn: periodo.in.rawTime,
    checkOut: salida ? salida.rawTime : null,
    entradaLog: periodo.in.log,
    salidaConsumida: salida ? salida.rawTime : null,
    incompleto: !salida,
    ambiguo,
  };
}

export interface ValidacionHrAttendance {
  valido: boolean;
  motivo?: string;
}

/**
 * Valida si un par check_in/check_out de `hr.attendance` es utilizable tal
 * cual, o si debe reconstruirse con `buildAttendancePair` a partir de
 * `attendance.log`.
 *
 * Un par es válido solo si:
 *  - existe check_in
 *  - existe check_out
 *  - check_out > check_in (duración positiva)
 *  - duración >= DURACION_MINIMA_MS (60s)
 *  - duración <= MAX_TURNO_MS
 *  - si hay marcaciones de `attendance.log` disponibles ese día (o el
 *    siguiente, para el checkout), el check_in y el check_out declarados por
 *    hr.attendance tienen una marcación real cercana que los respalda — si
 *    hr.attendance afirma un par que NINGUNA marcación biométrica real
 *    respalda, se considera contradicho y por lo tanto inválido.
 *  - si las marcaciones de `attendance.log` del día de check_in, POR SÍ
 *    SOLAS, ya arman un turno cerrado y sin ambigüedad (`buildAttendancePair`
 *    no necesita ambigüedad ni día siguiente para resolverlo), ese resultado
 *    es la verdad de referencia: si hr.attendance no coincide con él, se
 *    considera contradicho. Esto detecta el caso en que Odoo ya trae
 *    check_in/check_out mal emparejados de fábrica — p. ej. cruzando el
 *    cierre de un día con la apertura del siguiente (17:07 del día 1 →
 *    07:02 del día 2) — aunque cada extremo individualmente SÍ corresponda a
 *    una marcación real (solo que de dos eventos físicos distintos). El
 *    chequeo anterior (al menos un lado respaldado) no detecta esto porque
 *    ambos lados están "respaldados", solo que por marcaciones que no van
 *    juntas.
 *
 * localIn/localOut deben venir en horario LOCAL 'YYYY-MM-DD HH:mm:ss'
 * (mismo formato que `Punch.localTime`).
 */
export function validarParHrAttendance(
  localIn: string | null,
  localOut: string | null,
  marcacionesLogDelEmpleado: Punch[],
  toleranciaMatchMs: number = 10 * 60 * 1000,
): ValidacionHrAttendance {
  if (!localIn) return { valido: false, motivo: 'sin check_in' };
  if (!localOut) return { valido: false, motivo: 'sin check_out' };

  const fechaIn = localIn.split(' ')[0];
  const fechaOut = localOut.split(' ')[0];
  // Ambos ya incluyen fecha completa, así que la diferencia es correcta sin
  // ajustes manuales incluso cuando check_out cae en el día calendario
  // siguiente (turno que cruza medianoche).
  const inMs = new Date(localIn.replace(' ', 'T')).getTime();
  const outMs = new Date(localOut.replace(' ', 'T')).getTime();
  const duracionMs = outMs - inMs;

  if (duracionMs < DURACION_MINIMA_MS) {
    return { valido: false, motivo: 'duración no positiva o menor a 60s' };
  }
  if (duracionMs > MAX_TURNO_MS) {
    return { valido: false, motivo: 'duración excede el turno máximo' };
  }

  // Cruce contra attendance.log: si hay marcaciones reales disponibles para
  // este empleado en la ventana relevante, el check_in/check_out declarado
  // debe corresponder al MISMO par que produce el algoritmo canónico
  // (`buildAttendancePair`) para el día de `check_in`.
  //
  // No basta con que cada extremo, por separado, tenga alguna marcación
  // cercana: eso permite que hr.attendance combine la SALIDA real de un
  // turno con la ENTRADA real del turno del día siguiente como si fueran un
  // mismo par (ambos extremos existen de verdad en attendance.log, solo que
  // pertenecen a dos jornadas distintas). El único juez de qué marcación es
  // pareja de cuál es `buildAttendancePair`; aquí solo se verifica que el
  // par declarado coincida con lo que ese algoritmo determina de forma
  // independiente.
  const ventana = marcacionesLogDelEmpleado.filter((p) => {
    const f = p.localTime.split(' ')[0];
    return f === fechaIn || f === fechaOut;
  });
  if (ventana.length) {
    const parCanonico = buildAttendancePair(
      fechaIn,
      marcacionesLogDelEmpleado,
      new Set(),
    );
    if (!parCanonico) {
      return {
        valido: false,
        motivo: 'no coincide con ninguna marcación biométrica cercana',
      };
    }

    // Verdad de referencia: si las marcaciones del día de check_in, solas,
    // ya arman un turno cerrado y no ambiguo, hr.attendance debe coincidir.
    const reconstruido = buildAttendancePair(
      fechaIn,
      marcacionesLogDelEmpleado,
      new Set(),
    );
    if (
      reconstruido &&
      !reconstruido.ambiguo &&
      !reconstruido.incompleto &&
      reconstruido.checkOut
    ) {
      const punchIn = marcacionesLogDelEmpleado.find(
        (p) => p.rawTime === reconstruido.checkIn,
      );
      const punchOut = marcacionesLogDelEmpleado.find(
        (p) => p.rawTime === reconstruido.checkOut,
      );
      const reconstruidoInMs = punchIn
        ? new Date(punchIn.localTime.replace(' ', 'T')).getTime()
        : null;
      const reconstruidoOutMs = punchOut
        ? new Date(punchOut.localTime.replace(' ', 'T')).getTime()
        : null;
      const coincideIn =
        reconstruidoInMs !== null &&
        Math.abs(reconstruidoInMs - inMs) <= toleranciaMatchMs;
      const coincideOut =
        reconstruidoOutMs !== null &&
        Math.abs(reconstruidoOutMs - outMs) <= toleranciaMatchMs;
      if (!coincideIn || !coincideOut) {
        return {
          valido: false,
          motivo:
            'contradice el turno único y cerrado que arman las marcaciones de ese día por sí solas',
        };
      }
    }
  }

  return { valido: true };
}
