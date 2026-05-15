import { onRequest }  from 'firebase-functions/v2/https';
import { app } from '../app';
import { initFirebaseAdmin } from '../config/firebase-admin';

initFirebaseAdmin();

export const mercadopago = onRequest(
  {
    region:  'southamerica-east1',
    secrets: [
      'MERCADO_PAGO_TOKEN',
      'FRONTEND_URL',
    ],
  },
  app,
);
