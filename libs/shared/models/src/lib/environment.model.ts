import { FirebaseOptions } from '@angular/fire/app';

export interface AppEnvironment {
  production: boolean;
  firebase: FirebaseOptions;
  whatsappApiUrl: string;
  /** Origen del backend MP (sin `/api/...`), ej. https://derma-mercadopago.vercel.app */
  mercadoPagoApiUrl: string;
  cloudinary?: {
    cloudName: string;
    uploadPreset: string;
  };
  whatsappNumber?: string;
}
