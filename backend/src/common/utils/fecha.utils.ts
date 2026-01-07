// src/common/utils/fecha.utils.ts
export function getFechaColombia() {
  const ahoraCol = new Date().toLocaleString('en-US', {
    timeZone: 'America/Bogota',
  });
  const hoy = new Date(ahoraCol);
  
  const fechaISO =
    hoy.getFullYear() +
    '-' +
    String(hoy.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(hoy.getDate()).padStart(2, '0');

  const horaISO =
    String(hoy.getHours()).padStart(2, '0') +
    ':' +
    String(hoy.getMinutes()).padStart(2, '0') +
    ':' +
    String(hoy.getSeconds()).padStart(2, '0');

  return {
    inicioDia: `${fechaISO} 00:00:00`,
    finDia: `${fechaISO} 23:59:59`,
    ahoraStr: `${fechaISO} ${horaISO}`,
  };
}

export function decimalToMinutes(decimalTime: number): number {
  const hours = Math.floor(decimalTime);
  const minutes = Math.round((decimalTime - hours) * 60);
  return hours * 60 + minutes;
}