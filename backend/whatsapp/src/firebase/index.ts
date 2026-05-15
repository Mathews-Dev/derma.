import { initializeApp } from 'firebase-admin/app';
import { onRequest }  from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { app }        from '../app';
import { runRecordatorios } from './scheduler';

// En Cloud Functions initializeApp() sin parámetros es suficiente
initializeApp();

export const whatsapp = onRequest(
  {
    region:  'southamerica-east1',
    secrets: [
      'META_ACCESS_TOKEN',
      'META_PHONE_NUMBER_ID',
      'META_APP_SECRET',
      'WEBHOOK_VERIFY_TOKEN',
    ],
  },
  app,
);

export const recordatorios = onSchedule(
  {
    schedule:  'every 60 minutes',
    region:    'southamerica-east1',
    timeZone:  'America/Argentina/Buenos_Aires',
    secrets: [
      'META_ACCESS_TOKEN',
      'META_PHONE_NUMBER_ID',
    ],
  },
  async () => {
    await runRecordatorios();
  },
);