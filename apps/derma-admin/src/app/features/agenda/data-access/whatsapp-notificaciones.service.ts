import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface TurnoWhatsappBasePayload {
  telefono: string;
  pacienteNombre: string;
  fecha: string;
  horaInicio: string;
  accessToken: string;
}

export interface ConfirmacionTurnoWhatsappPayload extends TurnoWhatsappBasePayload {
  profesionalNombre: string;
}

export type CancelacionTurnoWhatsappPayload = TurnoWhatsappBasePayload;

export interface ReprogramacionTurnoWhatsappPayload {
  telefono: string;
  pacienteNombre: string;
  fechaNueva: string;
  horaNueva: string;
  profesionalNombre: string;
  accessToken: string;
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
    return firstValueFrom(
      this.http.post<{ ok: boolean }>(`${this.baseUrl}/messages/confirmar`, payload),
    );
  }

  enviarCancelacionTurno(payload: CancelacionTurnoWhatsappPayload): Promise<{ ok: boolean }> {
    return firstValueFrom(
      this.http.post<{ ok: boolean }>(`${this.baseUrl}/messages/cancelar`, payload),
    );
  }

  enviarReprogramacionTurno(payload: ReprogramacionTurnoWhatsappPayload): Promise<{ ok: boolean }> {
    return firstValueFrom(
      this.http.post<{ ok: boolean }>(`${this.baseUrl}/messages/reprogramar`, payload),
    );
  }

  enviarNoAsistioTurno(payload: TurnoWhatsappBasePayload): Promise<{ ok: boolean }> {
    return firstValueFrom(
      this.http.post<{ ok: boolean }>(`${this.baseUrl}/messages/no-asistio`, payload),
    );
  }
}
