import { InjectionToken } from '@angular/core';

/** Origins only, e.g. `https://derma-mercadopago.vercel.app` — sin barra final. */
export const MERCADOPAGO_API_BASE_URL = new InjectionToken<string>('MERCADOPAGO_API_BASE_URL');
