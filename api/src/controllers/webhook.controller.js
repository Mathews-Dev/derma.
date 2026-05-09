import { Payment } from 'mercadopago';
import { mpClient } from '../config/mercadopago.js';
import { isPaymentProcessed, markPaymentAsProcessed } from '../services/idempotency.service.js';
import { markTurnoAsPaid } from '../services/turno.service.js';

export async function handleWebhook(req, res) {
  const topic = req.query.topic || req.query.type;
  const paymentId = req.query.id || req.query['data.id'];

  console.log(`[Webhook] Topic: ${topic} — PaymentId: ${paymentId}`);

  try {
    if (topic === 'payment' && paymentId) {
      const alreadyProcessed = await isPaymentProcessed(paymentId);

      if (alreadyProcessed) {
        console.log(`[Webhook] Pago ${paymentId} ya procesado. Ignorando.`);
      } else {
        const paymentApi = new Payment(mpClient);
        const paymentData = await paymentApi.get({ id: paymentId });

        console.log(`[Webhook] Estado del pago ${paymentId}: ${paymentData.status}`);

        if (paymentData.status === 'approved') {
          await markPaymentAsProcessed({
            paymentId,
            externalReference: paymentData.external_reference,
            status: paymentData.status,
          });

          await markTurnoAsPaid({
            externalReference: paymentData.external_reference,
            paymentId,
            mpStatus: paymentData.status,
            merchantOrderId: paymentData.order?.id,
          });
        }
      }
    }
  } catch (error) {
    console.error('[Webhook] Error:', error.message);
  }

  // Responder siempre al final — MP espera máx 22 segundos
  res.sendStatus(200);
}
