const LOCALE = 'es-AR';
const TZ     = 'America/Argentina/Buenos_Aires';

export function formatFecha(date: Date): string {
  return date.toLocaleDateString(LOCALE, {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
    timeZone: TZ,
  });
  // → "martes, 15 de julio"
}

export function formatFechaCorta(date: Date): string {
  return date.toLocaleDateString(LOCALE, {
    day:   '2-digit',
    month: '2-digit',
    year:  'numeric',
    timeZone: TZ,
  });
  // → "15/07/2025"
}