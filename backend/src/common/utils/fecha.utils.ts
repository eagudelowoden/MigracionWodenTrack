// src/common/utils/fecha.utils.ts
export function getFechaColombia() {
  const ahora = new Date();
  
  // 1. Obtenemos la fecha en formato ISO pero convertida a UTC
  // Odoo espera YYYY-MM-DD HH:mm:ss en UTC
  const formatOdoo = (date: Date) => {
    return date.toISOString().replace('T', ' ').split('.')[0];
  };

  // 2. Para calcular el inicio del día en Colombia pero expresado en UTC:
  // Colombia es UTC-5, por lo tanto las 00:00:00 de Colombia son las 05:00:00 UTC
  const hoyCol = new Date(ahora.toLocaleString('en-US', { timeZone: 'America/Bogota' }));
  const fechaISO = hoyCol.getFullYear() +
    '-' + String(hoyCol.getMonth() + 1).padStart(2, '0') +
    '-' + String(hoyCol.getDate()).padStart(2, '0');

  return {
    // Para las búsquedas (search_count), usamos las 05:00:00 UTC (que son las 00:00 Col)
    inicioDia: `${fechaISO} 05:00:00`, 
    finDia: `${fechaISO} 23:59:59`, // Ajustar según necesidad
    // La hora actual real convertida a UTC para que Odoo no la mueva
    ahoraStr: formatOdoo(ahora), 
  };
}

export function decimalToMinutes(decimalTime: number): number {
  const hours = Math.floor(decimalTime);
  const minutes = Math.round((decimalTime - hours) * 60);
  return hours * 60 + minutes;
}