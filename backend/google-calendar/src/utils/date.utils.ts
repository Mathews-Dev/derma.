import { formatFechaHoraHumanaWhatsApp } from '../../../whatsapp/src/utils/date.utils';

/** Combina fecha (YYYY-MM-DD o ISO date) y hora HH:mm en ISO local para Calendar API. */
export function buildDateTimeIso(fecha: string, hora: string): string {
  const datePart = fecha.includes('T') ? fecha.split('T')[0] : fecha;
  return `${datePart}T${hora}:00`;
}

/** Texto humano para plantillas WhatsApp (mismo formato que turnos). */
export function formatFechaHoraParaWhatsApp(fechaInicioIso: string): string {
  return formatFechaHoraHumanaWhatsApp(new Date(fechaInicioIso));
}
