/** URLs del backend Mercado Pago (sin `/api/...`, sin barra final). */
export const MP_API_URL_PRODUCTION =
  'https://mercadopago-zy7nt5pbja-rj.a.run.app';

/** Debe coincidir con `PORT` en `.env` (por defecto 3001 en este monorepo). */
export const MP_API_URL_DEVELOPMENT = 'http://localhost:3001';

/** Elige backend MP según `production` del environment Angular. */
export function mercadoPagoApiUrlForMode(production: boolean): string {
  return production ? MP_API_URL_PRODUCTION : MP_API_URL_DEVELOPMENT;
}

/**
 * En el navegador, si la app corre en localhost siempre usa el backend local
 * (evita depender solo de fileReplacements del build).
 */
export function resolveMercadoPagoApiUrl(configuredUrl: string): string {
  if (typeof globalThis !== 'undefined') {
    const host = (globalThis as { location?: { hostname?: string } }).location?.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return MP_API_URL_DEVELOPMENT;
    }
  }
  return configuredUrl;
}
