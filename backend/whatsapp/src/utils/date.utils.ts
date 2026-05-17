/** Zona horaria para textos de WhatsApp (turnos / videoconsultas). */
const WHATSAPP_TZ = 'America/Argentina/Buenos_Aires';

function capitalizePalabra(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Fecha y hora legible para notificaciones WhatsApp:
 * "Miércoles 20 de mayo a las 10:00 hs"
 */
export function formatFechaHoraHumanaWhatsApp(date: Date): string {
  const dtf = new Intl.DateTimeFormat('es-AR', {
    timeZone:     WHATSAPP_TZ,
    weekday:      'long',
    day:          'numeric',
    month:        'long',
    hour:         '2-digit',
    minute:       '2-digit',
    hour12:       false,
  });
  const parts = dtf.formatToParts(date);
  const v = (t: Intl.DateTimeFormatPartTypes) =>
    parts.find(p => p.type === t)?.value ?? '';

  const weekday = capitalizePalabra(v('weekday'));
  const day     = v('day');
  const month   = v('month').toLowerCase();
  let hour      = v('hour');
  let minute    = v('minute');
  if (hour.length === 1) hour = `0${hour}`;
  if (minute.length === 1) minute = `0${minute}`;

  return `${weekday} ${day} de ${month} a las ${hour}:${minute} hs`;
}

/**
 * Solo fecha: "Miércoles 20 de mayo" (para plantillas que separan fecha y hora).
 */
export function formatSoloFechaHumanaWhatsApp(date: Date): string {
  const dtf = new Intl.DateTimeFormat('es-AR', {
    timeZone: WHATSAPP_TZ,
    weekday:  'long',
    day:      'numeric',
    month:    'long',
  });
  const parts = dtf.formatToParts(date);
  const v = (t: Intl.DateTimeFormatPartTypes) =>
    parts.find(p => p.type === t)?.value ?? '';

  const weekday = capitalizePalabra(v('weekday'));
  const day     = v('day');
  const month   = v('month').toLowerCase();

  return `${weekday} ${day} de ${month}`;
}

/**
 * Solo hora: "10:00 hs" (para plantillas que envían fecha y hora por separado).
 */
export function formatSoloHoraWhatsApp(date: Date): string {
  const dtf = new Intl.DateTimeFormat('es-AR', {
    timeZone: WHATSAPP_TZ,
    hour:     '2-digit',
    minute:   '2-digit',
    hour12:   false,
  });
  const parts = dtf.formatToParts(date);
  let hour   = parts.find(p => p.type === 'hour')?.value ?? '';
  let minute = parts.find(p => p.type === 'minute')?.value ?? '';
  if (hour.length === 1) hour = `0${hour}`;
  if (minute.length === 1) minute = `0${minute}`;
  return `${hour}:${minute} hs`;
}

/**
 * Día del turno (Timestamp Firestore) + hora "HH:mm" →
 * "Miércoles 20 de mayo a las 10:00 hs"
 */
export function formatDesdeFechaTurnoYHora(fecha: Date, horaInicio: string): string {
  const fechaHumana = formatSoloFechaHumanaWhatsApp(fecha);
  const horaHumana  = formatSoloHoraDesdeString(horaInicio);
  return `${fechaHumana} a las ${horaHumana}`;
}

export function formatSoloHoraDesdeString(horaInicio: string): string {
  const [hRaw, mRaw = '0'] = horaInicio.trim().split(':');
  const h = Math.min(23, Math.max(0, parseInt(hRaw, 10)));
  const m = Math.min(59, Math.max(0, parseInt(mRaw, 10)));
  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  return `${hh}:${mm} hs`;
}

/** Normaliza `fecha` del body (ISO, Timestamp serializado o ya legible) para plantillas. */
export function coerceFechaWhatsAppBody(fecha: unknown, fallback: Date): string {
  if (fecha == null || fecha === '') return formatSoloFechaHumanaWhatsApp(fallback);
  if (fecha instanceof Date) return formatSoloFechaHumanaWhatsApp(fecha);
  if (typeof fecha === 'string') {
    const d = new Date(fecha);
    if (!Number.isNaN(d.getTime())) return formatSoloFechaHumanaWhatsApp(d);
    return fecha;
  }
  return formatSoloFechaHumanaWhatsApp(fallback);
}

/** Normaliza hora del body "H:mm" o "HH:mm" → "HH:mm hs". Si no coincide, devuelve el string. */
export function coerceHoraWhatsAppBody(hora: unknown): string {
  if (hora == null || hora === '') return '';
  const s = String(hora).trim();
  if (/^\d{1,2}:\d{2}/.test(s)) return formatSoloHoraDesdeString(s);
  return s;
}

/** @deprecated Usar formatSoloFechaHumanaWhatsApp */
export function formatFecha(date: Date): string {
  return formatSoloFechaHumanaWhatsApp(date);
}

export function formatFechaCorta(date: Date): string {
  return date.toLocaleDateString('es-AR', {
    day:      '2-digit',
    month:    '2-digit',
    year:     'numeric',
    timeZone: WHATSAPP_TZ,
  });
}
