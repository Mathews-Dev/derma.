import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MERCADOPAGO_API_BASE_URL } from './mercadopago-api-base-url.token';
import {
  CrearPagoMercadoPagoBody,
  CrearPagoMercadoPagoResponse,
  MercadoPagoPaymentStatusResponse,
} from './mercadopago.types';

@Injectable({ providedIn: 'root' })
export class MercadoPagoPaymentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(MERCADOPAGO_API_BASE_URL);

  crearPreferencia(body: CrearPagoMercadoPagoBody, idempotencyKey: string): Observable<CrearPagoMercadoPagoResponse> {
    const url = `${this.normalizeBase(this.baseUrl)}/api/payment`;
    const headers = new HttpHeaders({
      'Idempotency-Key': idempotencyKey,
    });
    return this.http.post<CrearPagoMercadoPagoResponse>(url, body, { headers });
  }

  estadoPago(externalReference: string): Observable<MercadoPagoPaymentStatusResponse> {
    const encoded = encodeURIComponent(externalReference);
    const url = `${this.normalizeBase(this.baseUrl)}/api/payment/status/${encoded}`;
    return this.http.get<MercadoPagoPaymentStatusResponse>(url);
  }

  private normalizeBase(base: string): string {
    return base.replace(/\/+$/, '');
  }
}
