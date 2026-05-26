import { Request, Response } from 'express';
import {
  generarUrlDeAutorizacion,
  procesarCallbackDeGoogle,
} from '../services/auth.service';
import { desconectarGoogleCalendar } from '../services/profesional.service';
import {
  parseProfesionalUidFromState,
  redirectUrlPerfilGoogle,
} from '../utils/oauth-redirect.utils';

export async function iniciarConexionConGoogle(req: Request, res: Response): Promise<void> {
  const { profesionalUid } = req.params;
  if (!profesionalUid) {
    res.status(400).send('Falta profesionalUid');
    return;
  }

  const urlDeRedireccion = generarUrlDeAutorizacion(profesionalUid);
  res.redirect(urlDeRedireccion);
}

export async function recibirCallbackDeGoogle(req: Request, res: Response): Promise<void> {
  const profesionalUid = parseProfesionalUidFromState(req.query['state'] as string | undefined);

  const responderError = (message: string) => {
    res.redirect(redirectUrlPerfilGoogle('error', message));
  };

  try {
    const codigoDeAutorizacion = req.query['code'] as string;
    const errorGoogle = req.query['error'] as string | undefined;

    if (errorGoogle) {
      responderError(errorGoogle === 'access_denied' ? 'Conexión cancelada' : errorGoogle);
      return;
    }

    if (!codigoDeAutorizacion || !profesionalUid) {
      responderError('Faltan datos de autorización de Google');
      return;
    }

    await procesarCallbackDeGoogle(codigoDeAutorizacion, profesionalUid);

    console.log(`[auth] Google Calendar conectado para usuario ${profesionalUid}`);
    res.redirect(redirectUrlPerfilGoogle('conectado'));
  } catch (error) {
    console.error('[auth] callback error', error);
    const message = error instanceof Error ? error.message : 'unknown';
    res.redirect(redirectUrlPerfilGoogle('error', message));
  }
}

export async function desconectarGoogle(req: Request, res: Response): Promise<void> {
  const { profesionalUid } = req.params;
  if (!profesionalUid) {
    res.status(400).json({ error: 'Falta profesionalUid' });
    return;
  }
  await desconectarGoogleCalendar(profesionalUid);
  res.json({ ok: true, mensaje: 'Google Calendar desconectado' });
}
