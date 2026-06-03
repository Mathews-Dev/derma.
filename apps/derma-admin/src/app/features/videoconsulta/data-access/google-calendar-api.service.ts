import { inject, Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { environment } from '../../../../environments/environment';

export interface CrearEventoCalendarPayload {
  turnoId: string;
  profesionalUid: string;
  tituloEvento: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string;
  pacienteEmail: string;
  pacienteNombre: string;
  esVideoconsulta: boolean;
  telefonoNotificaciones?: string | null;
  profesionalNombre: string;
}

export interface CrearEventoCalendarResponse {
  ok: boolean;
  googleEventId: string;
  meetLink: string | null;
  linkEvento: string | null;
  whatsapp?: { enviado: boolean; detalle?: unknown };
}

@Injectable({ providedIn: 'root' })
export class GoogleCalendarApiService {
  private readonly functions = inject(Functions);
  private readonly baseUrl = (environment.googleCalendarApiUrl ?? '').replace(/\/$/, '');

  urlConectarGoogle(profesionalUid: string): string {
    return `${this.baseUrl}/auth/google/${encodeURIComponent(profesionalUid)}`;
  }

  crearEvento(body: CrearEventoCalendarPayload): Observable<CrearEventoCalendarResponse> {
    const callable = httpsCallable<
      CrearEventoCalendarPayload,
      CrearEventoCalendarResponse
    >(this.functions, 'crearEventoCalendario');

    return from(callable(body).then(result => result.data));
  }

  cancelarEvento(
    profesionalUid: string,
    googleEventId: string,
  ): Observable<{ ok: boolean; mensaje: string }> {
    const callable = httpsCallable<
      { profesionalUid: string; googleEventId: string },
      { ok: boolean; mensaje: string }
    >(this.functions, 'cancelarEventoCalendario');

    return from(callable({ profesionalUid, googleEventId }).then(result => result.data));
  }

  desconectarGoogle(profesionalUid: string): Observable<{ ok: boolean; mensaje: string }> {
    const callable = httpsCallable<
      { profesionalUid: string },
      { ok: boolean; mensaje: string }
    >(this.functions, 'desconectarGoogleCalendario');

    return from(callable({ profesionalUid }).then(result => result.data));
  }

  tieneBaseUrlConfigurada(): boolean {
    return this.baseUrl.length > 0;
  }
}
