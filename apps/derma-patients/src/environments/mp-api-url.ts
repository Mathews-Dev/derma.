export const MP_API_URL_PRODUCTION =
  'https://mercadopago-zy7nt5pbja-rj.a.run.app';

export const MP_API_URL_DEVELOPMENT = 'http://localhost:3001';

export function mercadoPagoApiUrlForMode(production: boolean): string {
  return production ? MP_API_URL_PRODUCTION : MP_API_URL_DEVELOPMENT;
}
