import {
  buildAttendancePair,
  validarParHrAttendance,
  dedupePunches,
  Punch,
} from './attendance-pairing';

/** Construye un Punch de prueba a partir de una fecha+hora 'YYYY-MM-DD HH:mm:ss'. */
function punch(localDateTime: string, log: any = {}): Punch {
  return {
    localTime: localDateTime,
    rawTime: localDateTime.replace(' ', 'T'),
    log,
  };
}

describe('buildAttendancePair (algoritmo canónico de emparejamiento)', () => {
  it('Caso 1: hr.attendance inválido (21:55->21:55) se reconstruye desde attendance.log como 14:02->21:55', () => {
    const marcaciones = [
      punch('2026-07-02 14:02:35'),
      punch('2026-07-02 21:55:33'),
    ];
    const par = buildAttendancePair('2026-07-02', marcaciones, new Set());
    expect(par).not.toBeNull();
    expect(par!.checkIn).toBe('2026-07-02T14:02:35');
    expect(par!.checkOut).toBe('2026-07-02T21:55:33');
    expect(par!.incompleto).toBe(false);
    expect(par!.ambiguo).toBe(false);
  });

  it('Caso 2: turno diurno fuera de malla (06:13->13:03) se respeta tal cual', () => {
    const marcaciones = [punch('2026-07-02 06:13:00'), punch('2026-07-02 13:03:00')];
    const par = buildAttendancePair('2026-07-02', marcaciones, new Set());
    expect(par!.checkIn).toBe('2026-07-02T06:13:00');
    expect(par!.checkOut).toBe('2026-07-02T13:03:00');
  });

  it('Caso 3: jornada nocturna cruzando medianoche (21:55 -> 05:02 día+1)', () => {
    const marcaciones = [
      punch('2026-07-02 21:55:00'),
      punch('2026-07-03 05:02:00'),
    ];
    const par = buildAttendancePair('2026-07-02', marcaciones, new Set());
    expect(par!.checkIn).toBe('2026-07-02T21:55:00');
    expect(par!.checkOut).toBe('2026-07-03T05:02:00');
    expect(par!.incompleto).toBe(false);
  });

  it('Caso 4: una sola marcación (22:03) queda incompleta, sin inventar salida', () => {
    const marcaciones = [punch('2026-07-02 22:03:00')];
    const par = buildAttendancePair('2026-07-02', marcaciones, new Set());
    expect(par!.checkIn).toBe('2026-07-02T22:03:00');
    expect(par!.checkOut).toBeNull();
    expect(par!.incompleto).toBe(true);
  });

  it('Caso 5: múltiples períodos el mismo día NO deben combinarse en 14:02->05:02', () => {
    const marcaciones = [
      punch('2026-07-02 14:02:00'),
      punch('2026-07-02 21:55:00'),
      punch('2026-07-02 22:04:00'),
      punch('2026-07-03 05:02:00'),
    ];
    const par = buildAttendancePair('2026-07-02', marcaciones, new Set());
    // NUNCA debe combinar el primer punch del día con el último del día
    // siguiente ignorando los del medio.
    expect(`${par!.checkIn}->${par!.checkOut}`).not.toBe(
      '2026-07-02T14:02:00->2026-07-03T05:02:00',
    );
    // El algoritmo detecta dos períodos (14:02-21:55 y 22:04-05:02) y toma
    // el más reciente como resultado de esta fecha, señalizando ambigüedad.
    expect(par!.checkIn).toBe('2026-07-02T22:04:00');
    expect(par!.checkOut).toBe('2026-07-03T05:02:00');
    expect(par!.ambiguo).toBe(true);
  });

  it('Caso reportado ALARCON DUARTE 25/06/2026: marcaciones de reintento en los bordes (07:00,07:02,17:00,17:07) NO deben partirse en dos turnos de minutos', () => {
    const marcaciones = [
      punch('2026-06-25 07:00:00'),
      punch('2026-06-25 07:02:00'),
      punch('2026-06-25 17:00:00'),
      punch('2026-06-25 17:07:00'),
    ];
    const par = buildAttendancePair('2026-06-25', marcaciones, new Set());
    // Nunca debe perder la entrada real de la mañana ni devolver el turno
    // de minutos (17:00->17:07) descartando 07:00-07:02.
    expect(par!.checkIn).toBe('2026-06-25T07:00:00');
    expect(par!.checkOut).toBe('2026-06-25T17:07:00');
    expect(par!.ambiguo).toBe(false);
  });

  it('Caso reportado ALARCON DUARTE en cascada (24-26/06/2026): un reintento de salida suelto (17:11) tras un turno cerrado NO debe robar la entrada del día siguiente cuando hay malla', () => {
    const marcaciones = [
      punch('2026-06-24 07:00:00'), punch('2026-06-24 17:00:00'), punch('2026-06-24 17:11:00'),
      punch('2026-06-25 07:02:00'), punch('2026-06-25 17:00:00'), punch('2026-06-25 17:07:00'),
      punch('2026-06-26 07:01:00'), punch('2026-06-26 16:00:00'),
    ];
    const finTurnoMin = 17 * 60; // malla 07:00 -> 17:00
    const consumidas = new Set<string>();

    const dia24 = buildAttendancePair('2026-06-24', marcaciones, consumidas, finTurnoMin);
    expect(dia24!.checkIn).toBe('2026-06-24T07:00:00');
    expect(dia24!.checkOut).toBe('2026-06-24T17:11:00');
    expect(dia24!.ambiguo).toBe(false);
    expect(dia24!.salidaConsumida).toBeNull();
    if (dia24!.salidaConsumida) consumidas.add(dia24!.salidaConsumida);

    // La entrada real del 25/06 debe seguir disponible (no fue robada por el 24/06).
    const dia25 = buildAttendancePair('2026-06-25', marcaciones, consumidas, finTurnoMin);
    expect(dia25!.checkIn).toBe('2026-06-25T07:02:00');
    expect(dia25!.checkOut).toBe('2026-06-25T17:07:00');
    if (dia25!.salidaConsumida) consumidas.add(dia25!.salidaConsumida);

    const dia26 = buildAttendancePair('2026-06-26', marcaciones, consumidas, finTurnoMin);
    expect(dia26!.checkIn).toBe('2026-06-26T07:01:00');
    expect(dia26!.checkOut).toBe('2026-06-26T16:00:00');
  });

  it('Sin malla (finTurnoMin no aportado), el mismo caso conserva el comportamiento previo (búsqueda de salida al día siguiente)', () => {
    const marcaciones = [
      punch('2026-06-24 07:00:00'),
      punch('2026-06-24 17:00:00'),
      punch('2026-06-24 17:11:00'),
      punch('2026-06-25 07:02:00'),
    ];
    const par = buildAttendancePair('2026-06-24', marcaciones, new Set());
    expect(par!.checkIn).toBe('2026-06-24T17:11:00');
    expect(par!.checkOut).toBe('2026-06-25T07:02:00');
  });

  it('Caso reportado ALTAMAR ARDILA 03/08/2026: varias marcaciones dentro de una misma jornada continua (pausas/cambios de zona) no deben partirse en turnos independientes', () => {
    const marcaciones = [
      punch('2026-08-03 06:45:37'),
      punch('2026-08-03 09:30:51'),
      punch('2026-08-03 09:58:45'),
      punch('2026-08-03 12:00:10'),
      punch('2026-08-03 12:58:49'),
      punch('2026-08-03 16:31:00'),
      punch('2026-08-04 06:44:14'), // entrada del día siguiente: no debe interferir
    ];
    const par = buildAttendancePair('2026-08-03', marcaciones, new Set());
    // Los tres pares (06:45-09:30, 09:58-12:00, 12:58-16:31) cierran solos
    // el mismo día → se fusionan en un solo turno, no se descartan los dos
    // primeros quedándose solo con el más reciente (12:58->16:31).
    expect(par!.checkIn).toBe('2026-08-03T06:45:37');
    expect(par!.checkOut).toBe('2026-08-03T16:31:00');
  });

  it('Caso 5 con malla aportada NO debe fusionarse: la marca suelta (22:04) está lejos del fin programado (17:00), se preserva como turno nocturno real', () => {
    const marcaciones = [
      punch('2026-07-02 14:02:00'),
      punch('2026-07-02 21:55:00'),
      punch('2026-07-02 22:04:00'),
      punch('2026-07-03 05:02:00'),
    ];
    const finTurnoMin = 17 * 60; // malla diurna 07:00 -> 17:00, no relacionada con 22:04
    const par = buildAttendancePair('2026-07-02', marcaciones, new Set(), finTurnoMin);
    expect(par!.checkIn).toBe('2026-07-02T22:04:00');
    expect(par!.checkOut).toBe('2026-07-03T05:02:00');
    expect(par!.ambiguo).toBe(true);
  });

  it('Caso AYALA JARAMILLO (empId 20270, 25-26/06/2026): una marca suelta 2h26m después del cierre NO debe reemplazar el turno cerrado ni robarle la entrada al día siguiente', () => {
    const marcaciones = [
      punch('2026-06-25 09:52:16'),
      punch('2026-06-25 17:13:53'),
      punch('2026-06-25 19:40:14'), // marca suelta: ruido, no un turno nocturno
      punch('2026-06-26 09:53:47'),
      punch('2026-06-26 16:35:18'),
    ];
    const finTurnoMin = 16 * 60; // malla 07:00 -> 16:00

    const dia25 = buildAttendancePair('2026-06-25', marcaciones, new Set(), finTurnoMin);
    expect(dia25!.checkIn).toBe('2026-06-25T09:52:16');
    expect(dia25!.checkOut).toBe('2026-06-25T17:13:53');
    expect(dia25!.salidaConsumida).toBeNull();

    // La entrada real del 26/06 debe seguir intacta (no fue robada por la
    // marca suelta del 25/06 a las 19:40).
    const dia26 = buildAttendancePair('2026-06-26', marcaciones, new Set(), finTurnoMin);
    expect(dia26!.checkIn).toBe('2026-06-26T09:53:47');
    expect(dia26!.checkOut).toBe('2026-06-26T16:35:18');
  });

  it('Caso ALTAMAR ARDILA (empId 20235, 06/08/2026): 5 marcaciones con pausas deben fusionarse en primera entrada -> última salida, aunque la última quede "suelta" por ser cantidad impar', () => {
    const marcaciones = [
      punch('2026-08-06 06:52:48'),
      punch('2026-08-06 09:59:38'),
      punch('2026-08-06 11:59:38'),
      punch('2026-08-06 12:54:34'),
      punch('2026-08-06 16:32:10'),
    ];
    const finTurnoMin = 16 * 60; // malla 07:00 -> 16:00
    const par = buildAttendancePair('2026-08-06', marcaciones, new Set(), finTurnoMin);
    expect(par!.checkIn).toBe('2026-08-06T06:52:48');
    expect(par!.checkOut).toBe('2026-08-06T16:32:10');
    expect(par!.incompleto).toBe(false);
    expect(par!.salidaConsumida).toBeNull();
  });

  it('Caso AYALA sigue correcto con 3+ períodos: la marca suelta lejos de finTurnoMin no debe "robarse" el período de la mitad ni perder la primera entrada del día', () => {
    // Variante de AYALA con un período EXTRA al inicio, para blindar contra el
    // bug donde el fallback tomaba `periodos[length-2]` (el del medio) en vez
    // de fusionar desde el PRIMER período cerrado del día.
    const marcaciones = [
      punch('2026-06-25 05:00:00'),
      punch('2026-06-25 06:00:00'), // primer período cerrado, corto
      punch('2026-06-25 09:52:16'),
      punch('2026-06-25 17:13:53'), // segundo período cerrado (el turno real)
      punch('2026-06-25 19:40:14'), // marca suelta: ruido
    ];
    const finTurnoMin = 16 * 60;
    const par = buildAttendancePair('2026-06-25', marcaciones, new Set(), finTurnoMin);
    expect(par!.checkIn).toBe('2026-06-25T05:00:00');
    expect(par!.checkOut).toBe('2026-06-25T17:13:53');
  });

  it('Caso 6: marcaciones duplicadas producen resultado determinístico', () => {
    const marcaciones = [
      punch('2026-07-02 22:00:00'),
      punch('2026-07-02 22:00:00'),
      punch('2026-07-03 05:02:00'),
      punch('2026-07-03 05:02:00'),
    ];
    const par = buildAttendancePair('2026-07-02', marcaciones, new Set());
    expect(par!.checkIn).toBe('2026-07-02T22:00:00');
    expect(par!.checkOut).toBe('2026-07-03T05:02:00');
  });

  it('Caso 7: jornada nocturna cruzando medianoche usa datetime completo (no solo horas)', () => {
    const marcaciones = [
      punch('2026-07-02 22:00:00'),
      punch('2026-07-03 05:00:00'),
    ];
    const par = buildAttendancePair('2026-07-02', marcaciones, new Set());
    expect(par!.checkIn.startsWith('2026-07-02')).toBe(true);
    expect(par!.checkOut!.startsWith('2026-07-03')).toBe(true);
  });

  it('marcaciones antes/después de una franja no descartadas: entrada temprana con salida tardía queda como un solo período largo si < 14h', () => {
    const marcaciones = [punch('2026-07-02 05:00:00'), punch('2026-07-02 18:30:00')];
    const par = buildAttendancePair('2026-07-02', marcaciones, new Set());
    expect(par!.checkIn).toBe('2026-07-02T05:00:00');
    expect(par!.checkOut).toBe('2026-07-02T18:30:00');
  });

  it('ausencia total de marcaciones devuelve null', () => {
    const par = buildAttendancePair('2026-07-02', [], new Set());
    expect(par).toBeNull();
  });

  it('span > 14h entre dos marcas del mismo día no se acepta como un solo turno', () => {
    // 05:00 y 23:30 del mismo día = 18h30, imposible como un solo turno.
    const marcaciones = [punch('2026-07-02 05:00:00'), punch('2026-07-02 23:30:00')];
    const par = buildAttendancePair('2026-07-02', marcaciones, new Set());
    // La última marca (23:30) se toma como una entrada nueva, no como salida
    // de la de las 05:00.
    expect(par!.checkIn).toBe('2026-07-02T23:30:00');
    expect(par!.checkOut).toBeNull();
  });
});

describe('dedupePunches', () => {
  it('colapsa marcaciones a menos de 60s de diferencia', () => {
    const marcaciones = [
      punch('2026-07-02 22:00:00'),
      punch('2026-07-02 22:00:30'),
      punch('2026-07-02 22:05:00'),
    ];
    const result = dedupePunches(marcaciones);
    expect(result).toHaveLength(2);
    expect(result[0].rawTime).toBe('2026-07-02T22:00:00');
    expect(result[1].rawTime).toBe('2026-07-02T22:05:00');
  });
});

describe('validarParHrAttendance', () => {
  it('Caso 8: par válido (22:03 -> 05:02) se conserva', () => {
    const marcaciones = [punch('2026-07-02 22:03:00'), punch('2026-07-03 05:02:00')];
    const r = validarParHrAttendance(
      '2026-07-02 22:03:00',
      '2026-07-03 05:02:00',
      marcaciones,
    );
    expect(r.valido).toBe(true);
  });

  it('Caso 9: duración > 14h se rechaza', () => {
    const r = validarParHrAttendance('2026-07-02 04:59:00', '2026-07-02 22:09:00', []);
    expect(r.valido).toBe(false);
    expect(r.motivo).toMatch(/máximo/);
  });

  it('Caso 10: check_out NULL se rechaza (requiere reconstrucción)', () => {
    const r = validarParHrAttendance('2026-07-02 21:55:00', null, []);
    expect(r.valido).toBe(false);
    expect(r.motivo).toMatch(/check_out/);
  });

  it('Caso 1 (validación): 21:55->21:55 se rechaza por duración no positiva', () => {
    const r = validarParHrAttendance('2026-07-02 21:55:33', '2026-07-02 21:55:33', []);
    expect(r.valido).toBe(false);
  });

  it('rechaza un par internamente válido pero que ninguna marcación biométrica respalda', () => {
    // hr.attendance dice 08:00->17:00, pero las marcaciones reales de ese día
    // están en otro horario completamente distinto.
    const marcaciones = [punch('2026-07-02 14:02:00'), punch('2026-07-02 21:55:00')];
    const r = validarParHrAttendance('2026-07-02 08:00:00', '2026-07-02 17:00:00', marcaciones);
    expect(r.valido).toBe(false);
    expect(r.motivo).toMatch(/no coincide/);
  });

  it('acepta un par válido cuando no hay marcaciones de attendance.log disponibles para contrastar', () => {
    const r = validarParHrAttendance('2026-07-02 08:00:00', '2026-07-02 17:00:00', []);
    expect(r.valido).toBe(true);
  });

  it('Caso ALARCON DUARTE (empId 20228, 25-26/06/2026): rechaza un hr.attendance que combina la salida del 25/06 con la entrada del 26/06 como si fuera un mismo par nocturno', () => {
    const marcaciones = [
      punch('2026-06-25 07:11:09'),
      punch('2026-06-25 17:07:55'),
      punch('2026-06-26 07:02:28'),
      punch('2026-06-26 16:00:30'),
    ];
    // hr.attendance (mal formado en Odoo) declara: check_in = salida real del
    // 25/06, check_out = entrada real del 26/06 — un "turno nocturno" de
    // ~13h54m que en realidad son dos jornadas diurnas distintas.
    const r = validarParHrAttendance(
      '2026-06-25 17:07:55',
      '2026-06-26 07:02:28',
      marcaciones,
    );
    expect(r.valido).toBe(false);

    // El par canónico para el 25/06 debe ser la propia jornada del 25/06.
    const dia25 = buildAttendancePair('2026-06-25', marcaciones, new Set());
    expect(dia25!.checkIn).toBe('2026-06-25T07:11:09');
    expect(dia25!.checkOut).toBe('2026-06-25T17:07:55');

    // Y el par canónico para el 26/06 debe seguir intacto, sin haber perdido
    // su entrada (07:02:28) a manos del 25/06.
    const dia26 = buildAttendancePair('2026-06-26', marcaciones, new Set());
    expect(dia26!.checkIn).toBe('2026-06-26T07:02:28');
    expect(dia26!.checkOut).toBe('2026-06-26T16:00:30');
  });
});
