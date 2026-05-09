import { findIdempotencyKey, markAsProcessing } from '../services/idempotency.service.js';

export async function idempotencyMiddleware(req, res, next) {
  const key = req.headers['idempotency-key'];

  if (!key) {
    return res.status(400).json({
      success: false,
      error: 'Falta el header Idempotency-Key',
    });
  }

  const existing = await findIdempotencyKey(key);

  if (existing) {
    if (existing.status === 'completed') {
      console.log(`[Idempotency] Key ${key} ya completada. Devolviendo caché.`);
      return res.json({ success: true, ...existing.response });
    }

    if (existing.status === 'processing') {
      console.log(`[Idempotency] Key ${key} en procesamiento.`);
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
