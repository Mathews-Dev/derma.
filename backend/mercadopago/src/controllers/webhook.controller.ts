import { Request, Response } from 'express';
import { Payment } from 'mercadopago';
import { getMpClient } from '../config/mercadopago';
import { isPaymentProcessed, markPaymentAsProcessed } from '../services/idempotency.service';
import { markTurnoAsPaid } from '../services/turno.service';

export async function handleWebhook(req: Request, res: Response): Promise<any> {
  const topic = req.query.topic || req.query.type;
  const paymentId = req.query.id || req.query['data.id'];

  console.log(`[Webhook] Topic: ${topic} — PaymentId: ${paymentId}`);

  try {
    if (topic === 'payment' && paymentId) {
      const alreadyProcessed = await isPaymentProcessed(paymentId as string);

      if (alreadyProcessed) {
        console.log(`[Webhook] Pago ${paymentId} ya procesado. Ignorando.`);
      } else {
        const paymentApi = new Payment(getMpClient());
        const paymentData = await paymentApi.get({ id: paymentId as string });

        console.log(`[Webhook] Estado del pago ${paymentId}: ${paymentData.status}`);

        if (paymentData.status === 'approved') {
          await markPaymentAsProcessed({
            paymentId: paymentId as string,
            externalReference: paymentData.external_reference!,
            status: paymentData.status,
          });

          await markTurnoAsPaid({
            externalReference: paymentData.external_reference!,
            paymentId: paymentId as string,
            mpStatus: paymentData.status,
            merchantOrderId: paymentData.order?.id,
          });
        }
      }
    }
  } catch (error: any) {
    console.error('[Webhook] Error:', error.message);
  }

  // Responder siempre al final — MP espera máx 22 segundos
  res.sendStatus(200);
}
