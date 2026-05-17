import { Request, Response } from 'express';
import { generarUrlDeAutorizacion, procesarCallbackDeGoogle } from '../services/auth.service';
import { env } from '../config/env';

export async function iniciarConexionConGoogle(req: Request, res: Response): Promise<void> {
  const { profesionalUid } = req.params;
  const urlDeRedireccion = generarUrlDeAutorizacion(profesionalUid);
  res.redirect(urlDeRedireccion);
}

export async function recibirCallbackDeGoogle(req: Request, res: Response): Promise<void> {
  try {
    const codigoDeAutorizacion = req.query['code'] as string;
    const profesionalUid = req.query['state'] as string;

    if (!codigoDeAutorizacion || !profesionalUid) {
      res.redirect(`${env.frontendUrl}/admin/configuracion?google=error`);
      return;
    }

    await procesarCallbackDeGoogle(codigoDeAutorizacion, profesionalUid);

    console.log(`[auth] Google Calendar conectado para usuario ${profesionalUid}`);
    res.redirect(`${env.frontendUrl}/admin/configuracion?google=conectado`);
  } catch (error) {
    console.error('[auth] callback error', error);
    res.redirect(
      `${env.frontendUrl}/admin/configuracion?google=error&message=${encodeURIComponent(
        error instanceof Error ? error.message : 'unknown',
      )}`,
    );
  }
}
