import { crearEvento } from '../services/calendar.service';
import {
  actualizarTurnoConVideoconsulta,
  actualizarTurnoGoogleCalendarSyncExterno,
} from '../services/turno.service';
import { notificarVideoconsultaConfirmada } from '../services/notification.service';
import { formatFechaHoraParaWhatsApp } from '../utils/date.utils';
import type { CrearEventoParams } from '../types/calendar.types';

export interface CrearEventoResult {
  ok: boolean;
  googleEventId: string;
  meetLink: string | null;
  linkEvento: string | null;
  whatsapp?: { enviado: boolean; detalle?: unknown };
}

export async function crearEventoHandler(
  body: CrearEventoParams,
): Promise<CrearEventoResult> {
  if (!body.turnoId || !body.profesionalUid || !body.fechaInicio || !body.fechaFin) {
    throw new Error('Faltan campos: turnoId, profesionalUid, fechaInicio, fechaFin');
  }

  console.log('[calendar] crearEvento', {
    turnoId: body.turnoId,
    profesionalUid: body.profesionalUid,
    esVideoconsulta: body.esVideoconsulta,
    pacienteEmail: body.pacienteEmail?.trim() || '(vacío)',
    fechaInicio: body.fechaInicio,
    fechaFin: body.fechaFin,
  });

  const resultado = await crearEvento(body);

  if (body.esVideoconsulta) {
    await actualizarTurnoConVideoconsulta(body.turnoId, {
      meetLink: resultado.meetLink,
      googleEventId: resultado.googleEventId,
      linkEvento: resultado.linkEvento,
    });
  } else {
    await actualizarTurnoGoogleCalendarSyncExterno(
      body.turnoId,
      resultado.googleEventId,
      resultado.linkEvento ?? null,
    );
  }

  let whatsapp: { enviado: boolean; detalle?: unknown } | undefined;
  if (body.esVideoconsulta && body.telefonoNotificaciones) {
    whatsapp = await notificarVideoconsultaConfirmada({
      telefono: body.telefonoNotificaciones,
      pacienteNombre: body.pacienteNombre,
      profesionalNombre: body.profesionalNombre,
      fechaHora: formatFechaHoraParaWhatsApp(body.fechaInicio),
      meetLink: resultado.meetLink,
    });
  }

  return { ok: true, ...resultado, whatsapp };
}
