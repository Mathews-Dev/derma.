import { initializeApp } from 'firebase-admin/app';
import { onRequest }  from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { app }        from '../../app';
import { runRecordatorios } from './scheduler';
import { onTurnoConfirmado } from './appointment-reminder';

export { onTurnoConfirmado };

initializeApp();

/**
 * HTTP endpoint for the WhatsApp webhook (receives and sends messages)
 */
export const whatsappWebhook = onRequest(
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

/**
 * Scheduled function: processes and sends pending appointment reminders every 10 minutes
 */
export const enviarRecordatoriosProgramados = onSchedule(
  {
    schedule:  '*/10 * * * *',
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
