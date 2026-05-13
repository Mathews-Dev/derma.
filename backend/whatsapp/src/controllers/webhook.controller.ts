import { Request, Response } from 'express';
import { env } from '../config/env';

export const webhookController = {

  // Meta hace un GET para verificar el webhook al configurarlo
  verify(req: Request, res: Response): void {
    const mode      = req.query['hub.mode'];
    const token     = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === env.WEBHOOK_VERIFY_TOKEN) {
      console.log('[Webhook] Verificación exitosa');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  },

  // Meta envía un POST por cada mensaje entrante del paciente
  receive(req: Request, res: Response): void {
    const body = req.body;

    if (body.object === 'whatsapp_business_account') {
      const entry   = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const message = changes?.value?.messages?.[0];

      if (message) {
        const from = message.from;
        const text = message.text?.body ?? '';
        console.log(`[Webhook] Mensaje de ${from}: ${text}`);
        // Acá podés agregar lógica de respuesta automática en el futuro
      }
    }

    // Meta requiere siempre un 200 inmediato
    res.sendStatus(200);
  },
};