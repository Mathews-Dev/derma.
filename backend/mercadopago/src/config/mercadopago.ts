import { MercadoPagoConfig } from 'mercadopago';
import { env } from './env';

let _mpClient: MercadoPagoConfig | null = null;

export function getMpClient(): MercadoPagoConfig {
  if (!_mpClient) {
    _mpClient = new MercadoPagoConfig({
      accessToken: env.MERCADO_PAGO_TOKEN,
    });
  }
  return _mpClient;
}
