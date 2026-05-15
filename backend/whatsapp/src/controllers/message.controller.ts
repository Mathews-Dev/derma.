import { Request, Response, NextFunction } from 'express';
import { sendTemplate } from '../services/whatsapp.service';
import { templates }    from '../templates';
import { formatPhoneAR } from '../utils/phone.utils';
import { formatFecha }   from '../utils/date.utils';

// Helper para no repetir try/catch en cada acción
function asyncHandler(
  fn: (req: Request, res: Response) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);
}

export const messageController = {

  confirmar: asyncHandler(async (req, res) => {
    const { telefono, pacienteNombre, fecha, horaInicio, profesionalNombre } = req.body;
    await sendTemplate(
      formatPhoneAR(telefono),
      templates.turnoConfirmado(
        pacienteNombre,
        fecha ?? formatFecha(new Date()),
        horaInicio,
        profesionalNombre,
      ),
    );
    res.json({ ok: true, mensaje: 'Confirmación enviada' });
  }),

  cancelar: asyncHandler(async (req, res) => {
    const { telefono, pacienteNombre, fecha, horaInicio, motivo } = req.body;
    await sendTemplate(
      formatPhoneAR(telefono),
      templates.turnoCancelado(
        pacienteNombre,
        fecha,
        horaInicio,
        motivo ?? 'Sin especificar',
      ),
    );
    res.json({ ok: true, mensaje: 'Cancelación enviada' });
  }),

  reprogramar: asyncHandler(async (req, res) => {
    const { telefono, pacienteNombre, fechaNueva, horaNueva, profesionalNombre } = req.body;
    await sendTemplate(
      formatPhoneAR(telefono),
      templates.turnoReprogramado(
        pacienteNombre,
        fechaNueva,
        horaNueva,
        profesionalNombre,
      ),
    );
    res.json({ ok: true, mensaje: 'Reprogramación enviada' });
  }),

  noAsistio: asyncHandler(async (req, res) => {
    const { telefono, pacienteNombre, fecha, horaInicio } = req.body;
    await sendTemplate(
      formatPhoneAR(telefono),
      templates.turnoNoAsistio(pacienteNombre, fecha, horaInicio),
    );
    res.json({ ok: true, mensaje: 'Notificación de ausencia enviada' });
  }),

};