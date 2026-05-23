import { Request, Response } from 'express';

import { Payment } from 'mercadopago';

import { getMpClient } from '../config/mercadopago';

import { isPaymentProcessed, markPaymentAsProcessed } from '../services/idempotency.service';

import { markTurnoAsPaid } from '../services/turno.service';



function resolveWebhookIds(req: Request): {

  topic: string | undefined;

  paymentId: string | undefined;

  source: 'query' | 'body' | 'none';

} {

  const queryTopic = String(req.query.topic || req.query.type || '') || undefined;

  const queryPaymentId = String(req.query.id || req.query['data.id'] || '') || undefined;

  if (queryTopic && queryPaymentId) {

    return { topic: queryTopic, paymentId: queryPaymentId, source: 'query' };

  }



  const body = req.body as Record<string, unknown> | undefined;

  const bodyData =

    typeof body?.['data'] === 'object' && body?.['data'] !== null

      ? (body['data'] as Record<string, unknown>)

      : undefined;

  const bodyTopic = String(body?.['type'] ?? body?.['topic'] ?? '') || undefined;

  const bodyPaymentId = String(bodyData?.['id'] ?? body?.['id'] ?? '') || undefined;



  if (bodyTopic || bodyPaymentId) {

    return {

      topic: bodyTopic || (String(body?.['action'] ?? '').includes('payment') ? 'payment' : undefined),

      paymentId: bodyPaymentId,

      source: 'body',

    };

  }



  return { topic: undefined, paymentId: undefined, source: 'none' };

}



function isPaymentWebhook(topic: string | undefined): boolean {

  if (!topic) return false;

  return topic === 'payment' || topic.includes('payment');

}



export async function handleWebhook(req: Request, res: Response): Promise<any> {

  const resolved = resolveWebhookIds(req);

  const topic = resolved.topic;

  const paymentId = resolved.paymentId;



  try {

    if (isPaymentWebhook(topic) && paymentId) {

      const alreadyProcessed = await isPaymentProcessed(paymentId);



      if (!alreadyProcessed) {

        const paymentApi = new Payment(getMpClient());

        const paymentData = await paymentApi.get({ id: paymentId });



        if (paymentData.status === 'approved') {

          await markPaymentAsProcessed({

            paymentId,

            externalReference: paymentData.external_reference!,

            status: paymentData.status,

          });



          await markTurnoAsPaid({

            externalReference: paymentData.external_reference!,

            paymentId,

            mpStatus: paymentData.status,

            merchantOrderId: paymentData.order?.id,

          });

        }

      }

    }

  } catch (error: any) {

    console.error('[Webhook] Error:', error.message);

  }



  res.sendStatus(200);

}

