import { Timestamp } from 'firebase/firestore';
import { EstadoTurno, Profesional, Turno, Usuario, ModalidadConsulta } from '@derma/models';
import type {
  VideoconsultaDetalle,
  VideoconsultaLinkEstado,
  VideoconsultaListRow,
  VideoconsultaNotificacionItem,
} from '../models/videoconsulta.view-model';

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

function inferModalidad(turno: Turno): ModalidadConsulta {
  return turno.modalidadConsulta ?? (turno.videoconsulta ? 'videoconsulta' : 'presencial');
}

function linkEstado(turno: Turno): VideoconsultaLinkEstado {
  if (!turno.videoconsulta) {
    return 'sin_crear';
  }
  const link = turno.videoconsulta.linkMeet?.trim();
  if (link) {
    return 'listo';
  }
  return 'pendiente';
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
  const le = linkEstado(turno);
  if (le === 'listo') {
    return 'Meet disponible';
  }
  if (le === 'pendiente') {
    return 'Enlace pendiente';
  }
  if (le === 'sin_crear' && inferModalidad(turno) === 'videoconsulta') {
    return 'Pendiente: generar Meet';
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
    linkEstado: linkEstado(turno),
    modalidadConsulta: inferModalidad(turno),
    notificacionResumen: notificacionResumen(turno),
  };
}

export function buildNotificacionesTimeline(turno: Turno): VideoconsultaNotificacionItem[] {
  const items: VideoconsultaNotificacionItem[] = [];
  const mod = formatFechaHora(turno.fechaModificacion ?? null);
  const cre = formatFechaHora(turno.fechaCreacion);

  if (!turno.videoconsulta) {
    if (inferModalidad(turno) === 'presencial') {
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
      texto: 'Evento creado en Calendar sin enlace Meet visible',
      fecha: mod || cre,
      tipo: 'error',
      detalleFallo: 'Revisar integración',
    });
  }

  if (turno.notificacionesWhatsApp) {
    items.push({
      texto: 'Avisos por WhatsApp habilitados para este turno',
      fecha: cre,
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
  const le = linkEstado(turno);
  const recordatorio = turno.notificacionesWhatsApp
    ? 'WhatsApp: avisos activados'
    : null;

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
    linkEstado: le,
    recordatorioEtiqueta: recordatorio,
    telefonoPaciente: turno.pacienteTelefono?.trim() || '—',
    telefonoProfesional: prof?.telefono?.trim() ?? '—',
    notificaciones: buildNotificacionesTimeline(turno),
    profesionalUid: turno.profesionalId,
    modalidadConsulta: inferModalidad(turno),
  };
}
