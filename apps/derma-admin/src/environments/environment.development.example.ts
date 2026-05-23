import { AppEnvironment } from '@derma/models';
import { mercadoPagoApiUrlForMode } from './mp-api-url';

/**
 * Copiá este archivo a `environment.development.ts` (está en .gitignore).
 * Se usa automáticamente con `nx serve derma-admin` (fileReplacements).
 */
export const environment: AppEnvironment = {
  production: false,
  firebase: {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'derma-7da60.firebaseapp.com',
    projectId: 'derma-7da60',
    storageBucket: 'derma-7da60.firebasestorage.app',
    messagingSenderId: '1079698773662',
    appId: 'YOUR_APP_ID',
  },
  /** Backend WhatsApp local (`WHATSAPP_PORT`, default 3003). */
  whatsappApiUrl: 'http://localhost:3003',
  mercadoPagoApiUrl: mercadoPagoApiUrlForMode(false),
  googleCalendarApiUrl: 'http://localhost:3002',
  cloudinary: {
    cloudName: 'mrpotato',
    uploadPreset: 'mr_myupload',
  },
  whatsappNumber: '5493885405345',
};
