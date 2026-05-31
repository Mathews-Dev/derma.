export const WHATSAPP_TZ = 'America/Argentina/Buenos_Aires';

function ymdCalendarioEnTz(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year:  'numeric',
    month: '2-digit',
    day:   '2-digit',
  }).format(date);
}

function parseYmd(ymd: string): { y: number; m: number; d: number } {
  const [y, m, d] = ymd.split('-').map(Number);
  return { y, m, d };
}

function addDaysYmd(ymd: string, days: number): string {
  const { y, m, d } = parseYmd(ymd);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function boundsDiaEnArgentina(ymd: string): { inicio: Date; fin: Date } {
  const { y, m, d } = parseYmd(ymd);
  return {
    inicio: new Date(Date.UTC(y, m - 1, d, 3, 0, 0, 0)),
    fin:    new Date(Date.UTC(y, m - 1, d + 1, 2, 59, 59, 999)),
  };
}

export function rangoFechaMananaArgentina(ahora = new Date()): { inicio: Date; fin: Date } {
  const mananaYmd = addDaysYmd(ymdCalendarioEnTz(ahora, WHATSAPP_TZ), 1);
  return boundsDiaEnArgentina(mananaYmd);
}

function capitalizePalabra(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

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

export function coerceHoraWhatsAppBody(hora: unknown): string {
  if (hora == null || hora === '') return '';
  const s = String(hora).trim();
  if (/^\d{1,2}:\d{2}/.test(s)) return formatSoloHoraDesdeString(s);
  return s;
}

export function formatFechaCorta(date: Date): string {
  return date.toLocaleDateString('es-AR', {
    day:      '2-digit',
    month:    '2-digit',
    year:     'numeric',
    timeZone: WHATSAPP_TZ,
  });
}
