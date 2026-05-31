import { Request, Response } from 'express';
import { env } from '../config/env';

export const webhookController = {

  verify(req: Request, res: Response): void {
    const mode      = req.query['hub.mode'];
    const token     = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === env.WEBHOOK_VERIFY_TOKEN) {
      console.log('[Webhook] Verification successful');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  },

  receive(req: Request, res: Response): void {
    const body = req.body;

    if (body.object === 'whatsapp_business_account') {
      const entry   = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const message = changes?.value?.messages?.[0];

      if (message) {
        const from = message.from;
        const text = message.text?.body ?? '';
        console.log(`[Webhook] Message from ${from}: ${text}`);
      }
    }

    res.sendStatus(200);
  },
};
