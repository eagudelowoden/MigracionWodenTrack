/**
 * Utilidades de fecha optimizadas para Odoo y Zona Horaria Colombia
 */

export function getFechaColombia() {
  const ahora = new Date();

  const fechaHoyCol = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(ahora);

  const manana = new Date(ahora);
  manana.setDate(manana.getDate() + 1);
  const fechaMananaCol = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(manana);

  // Formato YYYY-MM-DD HH:mm:ss para Colombia
  const ahoraStrCol = ahora.toLocaleString('sv-SE', { 
    timeZone: 'America/Bogota' 
  }).replace('T', ' ');

  // Formato UTC para Odoo (IMPORTANTE)
  const fechaParaOdoo = ahora.toISOString().replace('T', ' ').split('.')[0];

  console.log('--- LOG DE FECHAS ---');
  console.log('Local (Colombia):', ahoraStrCol);
  console.log('Para Odoo (UTC):', fechaParaOdoo);

  return {
    inicioDia: `${fechaHoyCol} 00:00:00`,
    cierreEstandar: `${fechaMananaCol} 04:59:59`, // <-- YA NO DARÁ ERROR
    ahoraStr: ahoraStrCol, 
    hoyFechaCorta: fechaHoyCol,
    fechaHoraISO: fechaParaOdoo // Usaremos este para enviar a Odoo
  };
}

/**
 * Convierte horas decimales de Odoo (ej: 8.5) a minutos totales (ej: 510)
 */
export function decimalToMinutes(decimalTime: number): number {
  const hours = Math.floor(decimalTime);
  const minutes = Math.round((decimalTime - hours) * 60);
  return hours * 60 + minutes;
}