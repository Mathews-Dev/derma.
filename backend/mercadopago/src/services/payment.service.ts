import { Preference } from 'mercadopago';
import { mpClient } from '../config/mercadopago';
import { generateQRBase64 } from '../utils/qr.utils';
import { sanitizeUrl, isPublicHttpUrl } from '../utils/url.utils';

export async function createPaymentPreference(params: { turnoId: string, precio: number, email: string, nombre: string }) {
  const preference = new Preference(mpClient);

  const frontendBaseUrl = sanitizeUrl(process.env.FRONTEND_URL) || 'http://localhost:4200';
  const backendBaseUrl = sanitizeUrl(process.env.BACKEND_URL || process.env.ngrok_url || '');

  let notificationUrl = sanitizeUrl(process.env.NOTIFICATION_URL);
  if (!notificationUrl && backendBaseUrl) {
    notificationUrl = `${backendBaseUrl}/api/webhook`;
  }

  const externalReference = `turno_${params.turnoId}_${Date.now()}`;

  const preferenceBody: any = {
    items: [
      {
        title: `Turno #${params.turnoId}`,
        quantity: 1,
        unit_price: Number(params.precio),
        currency_id: 'ARS',
      },
    ],
    payer: { email: params.email, name: params.nombre },
    back_urls: {
      success: `${frontendBaseUrl}/success`,
      failure: `${frontendBaseUrl}/failure`,
      pending: `${frontendBaseUrl}/pending`,
    },
    external_reference: externalReference,
  };

  if (isPublicHttpUrl(preferenceBody.back_urls.success)) {
    preferenceBody.auto_return = 'approved';
  } else {
    console.log('[MP] auto_return desactivado: back_urls.success no es pública.');
  }

  if (notificationUrl) {
    preferenceBody.notification_url = notificationUrl;
  }

  console.log('[MP] Creando preferencia para turno:', params.turnoId);

  const response = await preference.create({ body: preferenceBody });

  console.log('[MP] Preferencia creada:', response.id);

  const qrCodeBase64 = await generateQRBase64(response.init_point);

  return {
    id: response.id,
    init_point: response.init_point,
    qr_code_base64: qrCodeBase64,
    external_reference: externalReference,
  };
}
