import { Request, Response } from 'express';
import { createPaymentPreference } from '../services/payment.service';
import { updateTurnoWithPreference } from '../services/turno.service';
import { markAsCompleted, deleteKey } from '../services/idempotency.service';
import { Payment } from 'mercadopago';
import { getMpClient } from '../config/mercadopago';

export async function createPayment(req: Request, res: Response): Promise<any> {
  const { turnoId, precio, email, nombre } = req.body;
  const idempotencyKey = req.idempotencyKey;

  console.log(`[Payment] Request recibido — turnoId: ${turnoId}`);

  try {
    const result = await createPaymentPreference({ turnoId, precio, email, nombre });

    await updateTurnoWithPreference({
      turnoId,
      preferenceId: result.id!,
      externalReference: result.external_reference,
      idempotencyKey,
      initPoint: result.init_point!,
    });

    if (idempotencyKey) {
      await markAsCompleted(idempotencyKey, result);
    }

    return res.json({ success: true, ...result });

  } catch (error: any) {
    console.error('[Payment] Error:', error.message);
    if (idempotencyKey) await deleteKey(idempotencyKey);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al crear preferencia',
    });
  }
}

export async function getPaymentStatus(req: Request, res: Response): Promise<any> {
  const { external_reference } = req.params;

  try {
    const payment = new Payment(getMpClient());

    const searchResult = await payment.search({
      options: {
        external_reference,
        status: 'approved',
      },
    });

    if (searchResult.results && searchResult.results.length > 0) {
      return res.json({
        status: 'approved',
        payment_id: searchResult.results[0].id,
      });
    }

    res.json({ status: 'pending' });

  } catch (error: any) {
    console.error('[Payment] Error buscando estado:', error.message);
    res.status(500).json({ error: 'Error al verificar estado' });
  }
}
