// src/common/utils/fecha.utils.ts
export function getFechaColombia() {
  const ahora = new Date();

  // Odoo requiere formato YYYY-MM-DD HH:mm:ss en UTC
  const formatParaOdoo = (date: Date) => {
    return date.toISOString().replace('T', ' ').split('.')[0];
  };

  // Obtenemos la fecha actual en la zona de Bogotá (YYYY-MM-DD)
  const fechaHoyCol = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(ahora);

  // --- SOLUCIÓN AL DESFASE ---
  // Para que Odoo muestre 23:59:59 en Colombia, 
  // debemos enviar las 04:59:59 del día siguiente en UTC.
  const manana = new Date(ahora);
  manana.setDate(manana.getDate() + 1);
  const fechaMananaCol = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(manana);

  return {
    inicioDia: `${fechaHoyCol} 05:00:00`, // 00:00 Col = 05:00 UTC
    // Esto hará que en Odoo se vea como las 23:59:59 local
    cierreEstandar: `${fechaMananaCol} 04:59:59`, 
    ahoraStr: formatParaOdoo(ahora), 
  };
}
export function decimalToMinutes(decimalTime: number): number {
  const hours = Math.floor(decimalTime);
  const minutes = Math.round((decimalTime - hours) * 60);
  return hours * 60 + minutes;
}