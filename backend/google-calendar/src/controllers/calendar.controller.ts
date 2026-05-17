import { Request, Response, NextFunction } from 'express';
import { crearEvento, cancelarEvento, actualizarEvento } from '../services/calendar.service';
import { actualizarTurnoConVideoconsulta } from '../services/turno.service';
import { notificarVideoconsultaConfirmada } from '../services/notification.service';
import { formatFechaHoraParaWhatsApp } from '../utils/date.utils';
import { CrearEventoParams } from '../types/calendar.types';

function asyncHandler(
  fn: (req: Request, res: Response) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);
}

export const calendarController = {
  crearEvento: asyncHandler(async (req, res) => {
    const body = req.body as CrearEventoParams;

    if (!body.turnoId || !body.profesionalUid || !body.fechaInicio || !body.fechaFin) {
      res.status(400).json({
        error: 'Faltan campos: turnoId, profesionalUid, fechaInicio, fechaFin',
      });
      return;
    }

    const resultado = await crearEvento(body);

    await actualizarTurnoConVideoconsulta(body.turnoId, {
      meetLink: resultado.meetLink,
      googleEventId: resultado.googleEventId,
      linkEvento: resultado.linkEvento,
    });

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

    res.json({ ok: true, ...resultado, whatsapp });
  }),

  cancelarEvento: asyncHandler(async (req, res) => {
    const { profesionalUid, googleEventId } = req.body;

    if (!profesionalUid || !googleEventId) {
      res.status(400).json({ error: 'Faltan profesionalUid y googleEventId' });
      return;
    }

    await cancelarEvento(profesionalUid, googleEventId);
    res.json({ ok: true, mensaje: 'Evento cancelado en Google Calendar' });
  }),

  actualizarEvento: asyncHandler(async (req, res) => {
    const { profesionalUid, googleEventId, nuevaFechaInicio, nuevaFechaFin } = req.body;

    if (!profesionalUid || !googleEventId || !nuevaFechaInicio || !nuevaFechaFin) {
      res.status(400).json({
        error: 'Faltan profesionalUid, googleEventId, nuevaFechaInicio, nuevaFechaFin',
      });
      return;
    }

    await actualizarEvento(
      profesionalUid,
      googleEventId,
      nuevaFechaInicio,
      nuevaFechaFin,
    );
    res.json({ ok: true, mensaje: 'Evento actualizado en Google Calendar' });
  }),
};
