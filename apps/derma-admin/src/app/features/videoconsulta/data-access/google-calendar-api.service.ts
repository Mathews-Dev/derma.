import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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
  private readonly http = inject(HttpClient);
  private readonly baseUrl = (environment.googleCalendarApiUrl ?? '').replace(/\/$/, '');

  urlConectarGoogle(profesionalUid: string): string {
    return `${this.baseUrl}/auth/google/${encodeURIComponent(profesionalUid)}`;
  }

  crearEvento(body: CrearEventoCalendarPayload): Observable<CrearEventoCalendarResponse> {
    return this.http.post<CrearEventoCalendarResponse>(
      `${this.baseUrl}/calendario/eventos`,
      body,
    );
  }

  desconectarGoogle(profesionalUid: string) {
    return this.http.delete<{ ok: boolean; mensaje: string }>(
      `${this.baseUrl}/auth/google/${encodeURIComponent(profesionalUid)}`,
    );
  }

  tieneBaseUrlConfigurada(): boolean {
    return this.baseUrl.length > 0;
  }
}
