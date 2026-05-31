import { Request, Response } from 'express';
import { sendTemplate } from '../providers/whatsapp/whatsapp.service';
import { templates } from '../templates';
import { formatPhoneAR } from '../utils/phone.utils';
import {
  coerceFechaWhatsAppBody,
  coerceHoraWhatsAppBody,
} from '../utils/date.utils';
import { asyncHandler } from '../utils/async-handler.util';

function requireAccessToken(body: Record<string, unknown>): string {
  const token = body['accessToken'];
  if (typeof token !== 'string' || !token.trim()) {
    throw new Error('accessToken es requerido');
  }
  return token.trim();
}

export const messageController = {

  confirmar: asyncHandler(async (req, res) => {
    const { telefono, pacienteNombre, fecha, horaInicio, profesionalNombre } = req.body;
    await sendTemplate(
      formatPhoneAR(telefono),
      templates.turnoConfirmado(
        pacienteNombre,
        coerceFechaWhatsAppBody(fecha, new Date()),
        coerceHoraWhatsAppBody(horaInicio),
        profesionalNombre,
        requireAccessToken(req.body),
      ),
    );
    res.json({ ok: true, mensaje: 'Confirmación enviada' });
  }),

  cancelar: asyncHandler(async (req, res) => {
    const { telefono, pacienteNombre, fecha, horaInicio } = req.body;
    await sendTemplate(
      formatPhoneAR(telefono),
      templates.turnoCancelado(
        pacienteNombre,
        coerceFechaWhatsAppBody(fecha, new Date()),
        coerceHoraWhatsAppBody(horaInicio),
      ),
    );
    res.json({ ok: true, mensaje: 'Cancelación enviada' });
  }),

  reprogramar: asyncHandler(async (req, res) => {
    const {
      telefono,
      pacienteNombre,
      fechaNueva,
      horaNueva,
      profesionalNombre,
    } = req.body;
    await sendTemplate(
      formatPhoneAR(telefono),
      templates.turnoReprogramado(
        pacienteNombre,
        coerceFechaWhatsAppBody(fechaNueva, new Date()),
        coerceHoraWhatsAppBody(horaNueva),
        profesionalNombre,
        requireAccessToken(req.body),
      ),
    );
    res.json({ ok: true, mensaje: 'Reprogramación enviada' });
  }),

  noAsistio: asyncHandler(async (req, res) => {
    const { telefono, pacienteNombre, fecha, horaInicio } = req.body;
    await sendTemplate(
      formatPhoneAR(telefono),
      templates.turnoNoAsistio(
        pacienteNombre,
        coerceFechaWhatsAppBody(fecha, new Date()),
        coerceHoraWhatsAppBody(horaInicio),
      ),
    );
    res.json({ ok: true, mensaje: 'Notificación de ausencia enviada' });
  }),

  videoconsultaConfirmada: asyncHandler(async (req, res) => {
    const { telefono, pacienteNombre, profesionalNombre, fechaHora, meetCode } = req.body;

    if (!telefono || !pacienteNombre || !profesionalNombre || !fechaHora || !meetCode) {
      res.status(400).json({
        error:
          'Faltan campos: telefono, pacienteNombre, profesionalNombre, fechaHora, meetCode',
      });
      return;
    }

    await sendTemplate(
      formatPhoneAR(telefono),
      templates.videoconsultaConfirmada(
        pacienteNombre,
        profesionalNombre,
        fechaHora,
        meetCode,
      ),
    );
    res.json({ ok: true, mensaje: 'Videoconsulta confirmada' });
  }),

};
