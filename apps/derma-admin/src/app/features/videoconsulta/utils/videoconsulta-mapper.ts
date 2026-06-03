import { Timestamp } from 'firebase/firestore';
import { EstadoTurno, Profesional, Turno, Usuario } from '@derma/models';
import type {
  VideoconsultaDetalle,
  VideoconsultaListRow,
  VideoconsultaNotificacionItem,
} from '../models/videoconsulta.view-model';
import {
  buildRecordatorioEtiqueta,
  inferModalidadConsulta,
  linkEstadoFromTurno,
} from './videoconsulta-turno.utils';

const ESTADO_ETIQUETA: Record<EstadoTurno, string> = {
  [EstadoTurno.PENDIENTE]: 'Pendiente',
  [EstadoTurno.CONFIRMADO]: 'Confirmado',
  [EstadoTurno.REPROGRAMADO]: 'Reprogramado',
  [EstadoTurno.CANCELADO]: 'Cancelado',
  [EstadoTurno.COMPLETADO]: 'Completado',
  [EstadoTurno.ATENDIDO]: 'Atendido',
  [EstadoTurno.NO_ASISTIO]: 'No asistió',
};

export function codigoVideoconsulta(turno: Turno): string {
  if (turno.numeroTurno != null && turno.numeroTurno > 0) {
    return `VC-${turno.numeroTurno}`;
  }
  return `VC-${turno.id.slice(0, 8)}`;
}

function formatFechaCorta(d: Date): string {
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
  });
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

function estadoBadge(turno: Turno): 'success' | 'warning' | 'neutral' {
  switch (turno.estado) {
    case EstadoTurno.CONFIRMADO:
    case EstadoTurno.COMPLETADO:
    case EstadoTurno.ATENDIDO:
      return 'success';
    case EstadoTurno.PENDIENTE:
      return 'warning';
    default:
      return 'neutral';
  }
}

function notificacionResumen(turno: Turno): string {
  const le = linkEstadoFromTurno(turno);
  if (le === 'listo') {
    return 'Meet disponible';
  }
  if (le === 'pendiente') {
    return 'Enlace pendiente';
  }
  if (le === 'sin_crear' && inferModalidadConsulta(turno) === 'videoconsulta') {
    return 'Pendiente: generar Meet';
  }
  if (turno.recordatorioWhatsAppEnviadoAt) {
    return 'Recordatorio enviado';
  }
  if (turno.recordatorioProgramadoPara) {
    return 'Recordatorio programado';
  }
  return '—';
}

export function mapTurnoToListRow(turno: Turno): VideoconsultaListRow {
  const fd = turno.fecha.toDate();
  return {
    id: turno.id,
    codigo: codigoVideoconsulta(turno),
    pacienteNombre: turno.pacienteNombre,
    profesionalNombre: turno.profesionalNombre,
    fechaCorta: formatFechaCorta(fd),
    hora: turno.horaInicio,
    duracionMin: turno.duracion,
    estadoEtiqueta: ESTADO_ETIQUETA[turno.estado] ?? turno.estado,
    estadoBadge: estadoBadge(turno),
    linkMeet: turno.videoconsulta?.linkMeet?.trim() ?? '',
    linkEstado: linkEstadoFromTurno(turno),
    modalidadConsulta: inferModalidadConsulta(turno),
    notificacionResumen: notificacionResumen(turno),
  };
}

export function buildNotificacionesTimeline(turno: Turno): VideoconsultaNotificacionItem[] {
  const items: VideoconsultaNotificacionItem[] = [];
  const mod = formatFechaHora(turno.fechaModificacion ?? null);
  const cre = formatFechaHora(turno.fechaCreacion);

  if (!turno.videoconsulta) {
    if (inferModalidadConsulta(turno) === 'presencial') {
      items.push({
        texto: 'Turno registrado como consulta presencial',
        fecha: cre,
        tipo: 'ok',
      });
      return items;
    }
    items.push({
      texto: 'Todavía no hay evento de videoconsulta en Google Calendar',
      fecha: mod || cre,
      tipo: 'ok',
    });
    return items;
  }

  if (turno.videoconsulta.linkMeet?.trim()) {
    items.push({
      texto: 'Enlace de Google Meet asignado al turno',
      fecha: mod || cre,
      tipo: 'ok',
    });
  } else {
    items.push({
      texto: 'Evento en Calendar sin enlace Meet visible',
      fecha: mod || cre,
      tipo: 'error',
      detalleFallo: 'Revisar integración',
    });
  }

  if (turno.notificacionesWhatsApp) {
    items.push({
      texto: 'Confirmación y recordatorio por WhatsApp habilitados',
      fecha: cre,
      tipo: 'ok',
    });
  }

  if (turno.recordatorioProgramadoPara) {
    items.push({
      texto: `Recordatorio programado para ${formatFechaHora(turno.recordatorioProgramadoPara)}`,
      fecha: formatFechaHora(turno.recordatorioProgramadoPara),
      tipo: 'ok',
    });
  }

  if (turno.recordatorioWhatsAppEnviadoAt) {
    items.push({
      texto: 'Recordatorio WhatsApp enviado al paciente',
      fecha: formatFechaHora(turno.recordatorioWhatsAppEnviadoAt),
      tipo: 'ok',
    });
  }

  return items;
}

function matriculaProfesional(prof: Usuario | undefined): string {
  if (prof && 'numeroMatriculaNacional' in prof) {
    const p = prof as Profesional;
    if (p.numeroMatriculaNacional) {
      return `MN: ${p.numeroMatriculaNacional}`;
    }
  }
  return '—';
}

export function mapTurnoToDetalle(turno: Turno, prof: Usuario | undefined): VideoconsultaDetalle {
  const fd = turno.fecha.toDate();

  return {
    id: turno.id,
    codigo: codigoVideoconsulta(turno),
    pacienteNombre: turno.pacienteNombre,
    pacienteDni: turno.pacienteDNI?.trim() || '—',
    profesionalNombre: turno.profesionalNombre,
    profesionalMatricula: matriculaProfesional(prof),
    fechaCorta: formatFechaCorta(fd),
    hora: turno.horaInicio,
    duracionMin: turno.duracion,
    estadoEtiqueta: ESTADO_ETIQUETA[turno.estado] ?? turno.estado,
    estadoBadge: estadoBadge(turno),
    linkMeet: turno.videoconsulta?.linkMeet?.trim() ?? '',
    linkEstado: linkEstadoFromTurno(turno),
    recordatorioEtiqueta: buildRecordatorioEtiqueta(turno),
    telefonoPaciente: turno.pacienteTelefono?.trim() || '—',
    telefonoProfesional: prof?.telefono?.trim() ?? '—',
    notificaciones: buildNotificacionesTimeline(turno),
    profesionalUid: turno.profesionalId,
    modalidadConsulta: inferModalidadConsulta(turno),
  };
}
