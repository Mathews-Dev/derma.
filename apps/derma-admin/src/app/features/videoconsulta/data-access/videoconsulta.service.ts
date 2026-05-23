import { inject, Injectable } from '@angular/core';
import { FirestoreService, TurnosService } from '@derma/firebase';
import { Turno, Usuario } from '@derma/models';
import { Observable, from, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import type { VideoconsultaDetalle, VideoconsultaListRow } from '../models/videoconsulta.view-model';
import { mapTurnoToDetalle, mapTurnoToListRow } from '../utils/videoconsulta-mapper';

/** Alineado a agenda hasta existir contexto multi-clínica. */
const CLINICA_ID = 'clinica_default';

@Injectable({ providedIn: 'root' })
export class VideoconsultaService {
  private readonly turnos = inject(TurnosService);
  private readonly firestore = inject(FirestoreService);

  static defaultRango(): { desde: Date; hasta: Date } {
    const desde = new Date();
    desde.setDate(desde.getDate() - 14);
    const hasta = new Date();
    hasta.setDate(hasta.getDate() + 90);
    return { desde, hasta };
  }

  /**
   * Incluye turnos marcados como videoconsulta o con bloque `videoconsulta` ya persistido (Calendar).
   */
  videoconsultaListRows$(desde: Date, hasta: Date): Observable<VideoconsultaListRow[]> {
    return this.turnos.getTurnosByRango(desde, hasta, CLINICA_ID).pipe(
      map(turnos =>
        turnos
          .filter(t => t.modalidadConsulta === 'videoconsulta' || t.videoconsulta != null)
          .map(mapTurnoToListRow),
      ),
    );
  }

  /**
   * Turno + vista de detalle en tiempo real (profesional para matrícula / teléfono).
   * `undefined` si el documento no existe.
   */
  watchTurnoYDetalle$(turnoId: string): Observable<{ turno: Turno; detalle: VideoconsultaDetalle } | undefined> {
    return this.turnos.watchById(turnoId).pipe(
      switchMap(turno => {
        if (!turno) {
          return of(undefined);
        }
        return from(this.firestore.getDocument<Usuario>('usuarios', turno.profesionalId)).pipe(
          map(prof => ({ turno, detalle: mapTurnoToDetalle(turno, prof) })),
        );
      }),
    );
  }
}
