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
});
