import { DestroyRef, effect, inject, Injectable } from '@angular/core';
import { AlertasInsumosService, AuthService } from '@derma/firebase';

/**
 * Re-evaluación en segundo plano mientras el admin está abierto.
 * No guarda historial en RAM: cada tick lee Firestore, procesa y termina.
 */
const INTERVALO_MS = 30 * 60 * 1000;

@Injectable()
export class InventarioAlertasSyncService {
  private readonly alertas     = inject(AlertasInsumosService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef  = inject(DestroyRef);

  private intervalId: ReturnType<typeof setInterval> | null = null;
  private uidActivo: string | null = null;

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      this._detenerIntervalo();

      if (!user?.uid) {
        this.uidActivo = null;
        return;
      }

      if (this.uidActivo !== user.uid) {
        this.uidActivo = user.uid;
        void this._ejecutar('login');
      }

      this._iniciarIntervaloSiVisible();
    });

    if (typeof document !== 'undefined') {
      const onVisible = (): void => {
        if (document.visibilityState === 'hidden') {
          this._detenerIntervalo();
          return;
        }
        if (!this.uidActivo) return;
        this._iniciarIntervaloSiVisible();
        void this._ejecutar('tab-visible');
      };
      document.addEventListener('visibilitychange', onVisible);
      this.destroyRef.onDestroy(() => document.removeEventListener('visibilitychange', onVisible));
    }

    this.destroyRef.onDestroy(() => this._detenerIntervalo());
  }

  solicitarVerificacion(origen = 'manual'): void {
    void this._ejecutar(origen);
  }

  private _iniciarIntervaloSiVisible(): void {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return;
    }
    if (this.intervalId != null) return;

    this.intervalId = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }
      void this._ejecutar('intervalo');
    }, INTERVALO_MS);
  }

  private async _ejecutar(origen: string): Promise<void> {
    try {
      await this.alertas.verificar();
    } catch (err) {
      console.error(`[inventario-alertas-sync] falló (${origen})`, err);
    }
  }

  private _detenerIntervalo(): void {
    if (this.intervalId != null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
