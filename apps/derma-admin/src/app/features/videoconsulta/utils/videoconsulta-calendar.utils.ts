import { Turno } from '@derma/models';
import type { CrearEventoCalendarPayload } from '../data-access/google-calendar-api.service';

export function turnoARangoIsoUtc(turno: Turno): { fechaInicio: string; fechaFin: string } {
  const base = turno.fecha.toDate();
  const [hIni, mIni] = turno.horaInicio.split(':').map(Number);
  const [hFin, mFin] = turno.horaFin.split(':').map(Number);
  const inicio = new Date(base);
  inicio.setHours(hIni, mIni ?? 0, 0, 0);
  const fin = new Date(base);
  fin.setHours(hFin, mFin ?? 0, 0, 0);
  return { fechaInicio: inicio.toISOString(), fechaFin: fin.toISOString() };
}

export function buildCrearEventoPayload(
  turno: Turno,
  options?: { enviarWhatsapp?: boolean },
): CrearEventoCalendarPayload {
  const payload = buildCalendarEventPayloadParaTurno(turno, true);
  if (options?.enviarWhatsapp === false) {
    payload.telefonoNotificaciones = null;
  }
  return payload;
}

export function buildCrearEventoPayloadPresencial(turno: Turno): CrearEventoCalendarPayload {
  return buildCalendarEventPayloadParaTurno(turno, false);
}

function buildCalendarEventPayloadParaTurno(
  turno: Turno,
  esVideoconsulta: boolean,
): CrearEventoCalendarPayload {
  const { fechaInicio, fechaFin } = turnoARangoIsoUtc(turno);
  const descripcion = [turno.notasPaciente, turno.tratamientoNombre]
    .filter(Boolean)
    .join('\n')
    .trim();

  const tituloEvento = esVideoconsulta
    ? `Videoconsulta — ${turno.pacienteNombre}`
    : `Consulta presencial — ${turno.pacienteNombre}`;

  const descBase = esVideoconsulta ? 'Videoconsulta' : 'Consulta presencial · Turno desde la clínica';

  return {
    turnoId: turno.id,
    profesionalUid: turno.profesionalId,
    tituloEvento,
    descripcion: descripcion || descBase,
    fechaInicio,
    fechaFin,
    pacienteEmail: turno.pacienteEmail ?? '',
    pacienteNombre: turno.pacienteNombre,
    esVideoconsulta,
    telefonoNotificaciones: turno.telefonoNotificaciones ?? turno.pacienteTelefono ?? null,
    profesionalNombre: turno.profesionalNombre,
  };
}
