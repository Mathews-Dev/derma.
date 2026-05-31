import { Request, Response } from 'express';
import {
  cancelarTurnoPorAccessToken,
  getTurnoByAccessToken,
} from '../services/appointment-portal.service';
import { asyncHandler } from '../utils/async-handler.util';

export const appointmentController = {
  obtener: asyncHandler(async (req, res) => {
    const accessToken = String(req.params['accessToken'] ?? '').trim();
    if (!accessToken) {
      res.status(400).json({ error: 'Token inválido' });
      return;
    }
    const turno = await getTurnoByAccessToken(accessToken);
    if (!turno) {
      res.status(404).json({ error: 'Turno no encontrado' });
      return;
    }
    res.json({ ok: true, turno });
  }),

  cancelar: asyncHandler(async (req, res) => {
    const accessToken = String(req.params['accessToken'] ?? '').trim();
    const { motivo, pacienteUid } = req.body as { motivo?: string; pacienteUid?: string };
    if (!accessToken) {
      res.status(400).json({ error: 'Token inválido' });
      return;
    }
    try {
      await cancelarTurnoPorAccessToken(
        accessToken,
        motivo ?? 'Cancelado por el paciente',
        pacienteUid,
      );
      res.json({ ok: true, mensaje: 'Turno cancelado' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al cancelar';
      res.status(400).json({ error: msg });
    }
  }),
};
