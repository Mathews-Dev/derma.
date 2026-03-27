import { FirebaseOptions } from '@angular/fire/app';

export interface AppEnvironment {
  production: boolean;
  firebase: FirebaseOptions;
  whatsappApiUrl: string;
  mercadoPagoApiUrl: string;
  cloudinary?: {
    cloudName: string;
    uploadPreset: string;
  };
  whatsappNumber?: string;
}
