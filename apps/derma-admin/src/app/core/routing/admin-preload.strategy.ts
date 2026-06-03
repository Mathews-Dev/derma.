import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

/** Espera a que termine la carga inicial antes de precargar rutas frecuentes. */
const PRELOAD_DELAY_MS = 1500;

@Injectable({ providedIn: 'root' })
export class AdminPreloadStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    if (route.data?.['preload'] !== true) {
      return of(null);
    }
    return timer(PRELOAD_DELAY_MS).pipe(mergeMap(() => load()));
  }
}
