/** Body POST /api/payment (validación en backend). */
export interface CrearPagoMercadoPagoBody {
  turnoId: string;
  precio: number;
  email: string;
  nombre: string;
}

/** Respuesta exitosa crear preferencia + QR. */
export interface CrearPagoMercadoPagoResponse {
  success: boolean;
  id?: string;
  init_point?: string;
  qr_code_base64?: string | null;
  external_reference?: string;
  error?: string;
}

export interface MercadoPagoPaymentStatusResponse {
  status: 'approved' | 'pending';
  payment_id?: string | number;
}
