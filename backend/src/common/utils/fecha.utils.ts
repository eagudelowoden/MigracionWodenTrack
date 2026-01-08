// src/common/utils/fecha.utils.ts
export function getFechaColombia() {
  const ahora = new Date();

  // Odoo requiere formato YYYY-MM-DD HH:mm:ss en UTC
  const formatParaOdoo = (date: Date) => {
    return date.toISOString().replace('T', ' ').split('.')[0];
  };

  // Obtenemos la fecha actual en la zona de Bogotá para calcular el inicio del día
  const fechaHoyCol = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(ahora); // Retorna "YYYY-MM-DD"

  return {
    // IMPORTANTE: Para Odoo, el inicio del día 00:00 Col son las 05:00 UTC
    inicioDia: `${fechaHoyCol} 05:00:00`, 
    finDia: `${fechaHoyCol} 23:59:59`,
    // Esta es la hora que se guarda. toISOString() ya viene en UTC.
    ahoraStr: formatParaOdoo(ahora), 
  };
}
export function decimalToMinutes(decimalTime: number): number {
  const hours = Math.floor(decimalTime);
  const minutes = Math.round((decimalTime - hours) * 60);
  return hours * 60 + minutes;
}