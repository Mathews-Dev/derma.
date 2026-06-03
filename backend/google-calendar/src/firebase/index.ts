import { initializeApp } from 'firebase-admin/app';
import { onRequest } from 'firebase-functions/v2/https';
import { authApp } from '../app-auth';

export {
  crearEventoCalendario,
  cancelarEventoCalendario,
  desconectarGoogleCalendario,
} from './callables';

initializeApp();

const AUTH_SECRETS = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_REDIRECT_URI',
  'ENCRYPTION_KEY',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
] as const;

/** HTTP público solo para OAuth (redirect de Google). Calendario vía Callable Functions. */
export const googlecalendar = onRequest(
  {
    region: 'southamerica-east1',
    invoker: 'public',
    secrets: [...AUTH_SECRETS],
  },
  authApp,
);
