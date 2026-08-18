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

// Duración mínima para que un período emparejado por alternancia se
// considere un turno real e independiente. Un "período" más corto que esto
// (p. ej. 2 marcas separadas por 2-7 minutos) no es un turno en sí mismo —
// es una marcación de entrada o de salida repetida (reintento del
// dispositivo, doble tap) y debe fusionarse con el período adyacente en vez
// de tratarse como un turno separado.
export const MIN_PERIODO_PLAUSIBLE_MS = 30 * 60 * 1000;

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
    const gapMs = new Date(actual.rawTime).getTime() - new Date(anterior.rawTime).getTime();
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
      const spanMs = new Date(siguiente.rawTime).getTime() - new Date(actual.rawTime).getTime();
      if (spanMs < MAX_TURNO_MS) {
        periodos.push({ in: actual, out: spanMs >= DURACION_MINIMA_MS ? siguiente : null });
        i += 2;
        continue;
      }
    }
    // Sin siguiente marca, o el span a la siguiente es absurdo: `actual`
    // queda como período abierto (su salida se busca al día siguiente).
    periodos.push({ in: actual, out: null });
    i += 1;
  }
  return fusionarPeriodosCortos(periodos);
}

/**
 * Fusiona un período CERRADO cuya duración es implausiblemente corta
 * (< MIN_PERIODO_PLAUSIBLE_MS) con el período siguiente, extendiendo la
 * entrada del período fusionado hasta la salida del siguiente.
 *
 * Por qué es necesario: el emparejamiento por alternancia por sí solo no
 * distingue entre dos marcaciones que abren/cierran un turno real (p. ej.
 * 21:55 cierre de turno diurno + 22:04 apertura de turno nocturno, 9 min de
 * separación) y dos marcaciones que son simplemente un reintento del mismo
 * evento de entrada o de salida (p. ej. 07:00 y 07:02, 2 min de separación,
 * porque el dispositivo no leyó bien la primera vez). En ambos casos el gap
 * entre marcas es corto, así que el gap por sí solo no alcanza para
 * diferenciar los casos.
 *
 * La señal que sí los distingue es la duración del período resultante: un
 * turno real dura horas; una marcación repetida produce un "período" de
 * apenas minutos. Por eso, si un período cerrado dura menos de
 * MIN_PERIODO_PLAUSIBLE_MS, no se lo trata como un turno independiente: se
 * fusiona con el siguiente (su `in` pasa a ser la entrada real, y el
 * siguiente período aporta la salida), siempre que el período fusionado
 * siga siendo plausible (< MAX_TURNO_MS).
 *
 * Ejemplo (el caso que motivó esta función):
 *   07:00, 07:02, 17:00, 17:07
 *   → alternancia: [(07:00→07:02) 2min, (17:00→17:07) 7min]
 *   → (07:00→07:02) es implausible como turno → se fusiona con el siguiente
 *   → resultado: [(07:00→17:07)]
 *
 * Contraejemplo (NO debe fusionarse — son turnos reales distintos):
 *   14:02, 21:55, 22:04 (+ 05:02 del día siguiente)
 *   → alternancia: [(14:02→21:55) 7h53min, (22:04→…) abierto]
 *   → 7h53min ya es un turno plausible → no se fusiona
 */
function fusionarPeriodosCortos(periodos: Periodo[]): Periodo[] {
  if (periodos.length <= 1) return periodos;

  const resultado: Periodo[] = [];
  let actual = periodos[0];
  for (let i = 1; i < periodos.length; i++) {
    const siguiente = periodos[i];
    const duracionActualMs = actual.out
      ? new Date(actual.out.rawTime).getTime() - new Date(actual.in.rawTime).getTime()
      : null;
    const actualEsImplausible = duracionActualMs !== null && duracionActualMs < MIN_PERIODO_PLAUSIBLE_MS;

    if (actualEsImplausible) {
      const finSiguiente = siguiente.out ?? siguiente.in;
      const spanFusionadoMs = new Date(finSiguiente.rawTime).getTime() - new Date(actual.in.rawTime).getTime();
      if (spanFusionadoMs < MAX_TURNO_MS) {
        actual = { in: actual.in, out: siguiente.out };
        continue;
      }
    }
    resultado.push(actual);
    actual = siguiente;
  }
  resultado.push(actual);
  return resultado;
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
        new Date(periodo.in.rawTime).getTime() - new Date(previo.out.rawTime).getTime();
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
  // debe estar respaldado por al menos una marcación cercana.
  const ventana = marcacionesLogDelEmpleado.filter((p) => {
    const f = p.localTime.split(' ')[0];
    return f === fechaIn || f === fechaOut;
  });
  if (ventana.length) {
    // El respaldo se valida por proximidad usando `localTime` (hora local)
    // de las marcaciones — `localIn`/`localOut` también vienen en hora local.
    const inRespaldado = ventana.some(
      (p) => Math.abs(new Date(p.localTime.replace(' ', 'T')).getTime() - inMs) <= toleranciaMatchMs,
    );
    const outRespaldado = ventana.some(
      (p) => Math.abs(new Date(p.localTime.replace(' ', 'T')).getTime() - outMs) <= toleranciaMatchMs,
    );
    if (!inRespaldado && !outRespaldado) {
      return { valido: false, motivo: 'no coincide con ninguna marcación biométrica cercana' };
    }
  }

  return { valido: true };
}
