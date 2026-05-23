import { Request, Response, NextFunction } from 'express';
import { findIdempotencyKey, markAsProcessing } from '../services/idempotency.service';

// Extend express Request to include idempotencyKey
declare global {
  namespace Express {
    interface Request {
      idempotencyKey?: string;
    }
  }
}

export async function idempotencyMiddleware(req: Request, res: Response, next: NextFunction): Promise<any> {
  const key = req.headers['idempotency-key'] as string;

  if (!key) {
    return res.status(400).json({
      success: false,
      error: 'Falta el header Idempotency-Key',
    });
  }

  const existing = await findIdempotencyKey(key);

  if (existing) {
    if (existing.status === 'completed') {
      return res.json({ success: true, ...existing.response });
    }

    if (existing.status === 'processing') {
      return res.status(409).json({
        success: false,
        error: 'Pago en proceso. Aguardá unos segundos.',
      });
    }
  }

  await markAsProcessing(key);
  req.idempotencyKey = key;
  next();
}
