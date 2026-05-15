import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ConfirmacionTurnoWhatsappPayload {
  telefono: string;
  pacienteNombre: string;
  fecha: string;
  horaInicio: string;
  profesionalNombre: string;
}

/** Misma convención que el backend `whatsapp` (`formatFecha` en date.utils). */
export function formatFechaPlantillaWhatsapp(date: Date): string {
  return date.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Argentina/Buenos_Aires',
  });
}

@Injectable({ providedIn: 'root' })
export class WhatsappNotificacionesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.whatsappApiUrl.replace(/\/$/, '');

  enviarConfirmacionTurno(payload: ConfirmacionTurnoWhatsappPayload): Promise<{ ok: boolean }> {
    const url = `${this.baseUrl}/messages/confirmar`;
    return firstValueFrom(this.http.post<{ ok: boolean }>(url, payload));
  }
}
