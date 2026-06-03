import { Timestamp } from 'firebase/firestore';
import { EstadoTurno, ModalidadConsulta, Turno } from '@derma/models';
import type { VideoconsultaLinkEstado } from '../models/videoconsulta.view-model';

export type VideoconsultaListFiltro = 'proximas' | 'realizadas' | 'todas';

export function inferModalidadConsulta(turno: Turno): ModalidadConsulta {
  return turno.modalidadConsulta ?? (turno.videoconsulta ? 'videoconsulta' : 'presencial');
}

export function esVideoconsultaTurno(turno: Turno): boolean {
  return inferModalidadConsulta(turno) === 'videoconsulta';
}

export function linkEstadoFromTurno(turno: Turno): VideoconsultaLinkEstado {
  if (!turno.videoconsulta) {
    return 'sin_crear';
  }
  const link = turno.videoconsulta.linkMeet?.trim();
  if (link) {
    return 'listo';
  }
  return 'pendiente';
}

export function googleEventIdFromTurno(turno: Turno): string | null {
  const vc = turno.videoconsulta?.googleEventId?.trim();
  if (vc) return vc;
  return turno.googleCalendarSync?.eventId?.trim() || null;
}

function formatFechaHora(ts: Timestamp | Date | undefined | null): string {
  if (!ts) return '';
  const d = ts instanceof Date ? ts : ts.toDate();
  return d.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
  });
}

/** Texto para UI de recordatorio WhatsApp (1 h antes en videoconsulta). */
export function buildRecordatorioEtiqueta(turno: Turno): string | null {
  if (!turno.notificacionesWhatsApp) {
    return null;
  }
  if (turno.recordatorioWhatsAppEnviadoAt) {
    return `Recordatorio WhatsApp enviado (${formatFechaHora(turno.recordatorioWhatsAppEnviadoAt)})`;
  }
  if (turno.recordatorioProgramadoPara) {
    return `Recordatorio programado: ${formatFechaHora(turno.recordatorioProgramadoPara)}`;
  }
  return 'WhatsApp activo (recordatorio no programado)';
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function turnoMatchesVideoconsultaFiltro(
  turno: Turno,
  filtro: VideoconsultaListFiltro,
): boolean {
  if (filtro === 'todas') return true;

  const hoy = startOfDay(new Date());
  const fechaTurno = startOfDay(turno.fecha.toDate());

  if (filtro === 'proximas') {
    return (
      fechaTurno >= hoy &&
      (turno.estado === EstadoTurno.CONFIRMADO || turno.estado === EstadoTurno.PENDIENTE)
    );
  }

  return (
    turno.estado === EstadoTurno.ATENDIDO ||
    turno.estado === EstadoTurno.COMPLETADO ||
    (fechaTurno < hoy && turno.estado === EstadoTurno.CONFIRMADO)
  );
}
