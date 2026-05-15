import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';
import { env } from '../config/env';

export function metaSignature(req: Request, res: Response, next: NextFunction): void {
  const signature = req.headers['x-hub-signature-256'] as string;

  if (!signature) {
    res.status(401).json({ error: 'Firma ausente' });
    return;
  }

  const body     = JSON.stringify(req.body);
  const expected = 'sha256=' + crypto
    .createHmac('sha256', env.META_APP_SECRET)
    .update(body)
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    res.status(401).json({ error: 'Firma inválida' });
    return;
  }

  next();
}