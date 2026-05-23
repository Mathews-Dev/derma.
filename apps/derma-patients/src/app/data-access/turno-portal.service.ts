import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface TurnoPortalDto {
  id: string;
  pacienteId: string;
  pacienteNombre: string;
  profesionalNombre: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: string;
  estadoPago: string;
  monto: number;
  puedeModificar: boolean;
  horasRestantes: number;
  mensajePolitica: string;
}

@Injectable({ providedIn: 'root' })
export class TurnoPortalService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.whatsappApiUrl.replace(/\/$/, '');

  obtenerPorToken(accessToken: string) {
    return this.http.get<{ ok: boolean; turno: TurnoPortalDto }>(
      `${this.base}/public/turnos/${encodeURIComponent(accessToken)}`,
    );
  }

  cancelar(accessToken: string, motivo: string, pacienteUid?: string) {
    return this.http.post<{ ok: boolean; mensaje: string }>(
      `${this.base}/public/turnos/${encodeURIComponent(accessToken)}/cancelar`,
      { motivo, pacienteUid },
    );
  }
}
