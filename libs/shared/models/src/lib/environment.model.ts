import { FirebaseOptions } from '@angular/fire/app';

export interface AppEnvironment {
  production: boolean;
  firebase: FirebaseOptions;
  whatsappApiUrl: string;
  /** Origen del backend MP (sin `/api/...`), ej. https://mercadopago-….run.app */
  mercadoPagoApiUrl: string;
  /** Backend Google Calendar / Meet (sin barra final). Solo admin / integraciones. */
  googleCalendarApiUrl?: string;
  cloudinary?: {
    cloudName: string;
    uploadPreset: string;
  };
  whatsappNumber?: string;
}
