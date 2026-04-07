import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { switchMap, of } from 'rxjs';
import { AuthService } from '@derma/firebase';
import { NotificacionAdminService } from '@derma/firebase';
import { NotificacionAdmin } from '@derma/models';
import { ToastService } from '@derma/ui';

@Injectable()
export class NotificacionesStateService {
  private readonly notifService  = inject(NotificacionAdminService);
  private readonly authService   = inject(AuthService);
  private readonly toastService  = inject(ToastService);
  private readonly router        = inject(Router);

  private readonly _all = toSignal(
    toObservable(this.authService.currentUser).pipe(
      switchMap(user =>
        user ? this.notifService.getByDestinatario(user.uid) : of([])
      )
    ),
    { initialValue: [] as NotificacionAdmin[] }
  );

  readonly todas          = this._all;
  readonly noLeidas       = computed(() => this._all().filter(n => !n.leida));
  readonly recientes      = computed(() => this._all().slice(0, 10));
  readonly conteoNoLeidas = computed(() => this.noLeidas().length);
  readonly conteoBadge    = computed(() => {
    const c = this.conteoNoLeidas();
    if (c === 0) return null;
    return c > 99 ? '99+' : String(c);
  });
  readonly hayNoLeidas    = computed(() => this.conteoNoLeidas() > 0);
  readonly hayLeidas      = computed(() => this._all().some(n => n.leida));

  private prevIds = new Set<string>();
  private initialized = false;

  constructor() {
    effect(() => {
      const current = this._all();

      // Primera emisión real: registrar IDs existentes sin mostrar toast.
      // (initialValue = [] dispara el effect con array vacío antes de que lleguen datos.)
      if (!this.initialized) {
        if (current.length === 0) return; // todavía no llegaron datos — esperar
        this.prevIds     = new Set(current.map(n => n.id));
        this.initialized = true;
        return;
      }

      const nuevas = current.filter(n => !n.leida && !this.prevIds.has(n.id));
      this.prevIds = new Set(current.map(n => n.id));

      if (nuevas.length > 0) {
        nuevas.slice(0, 3).forEach(n =>
          this.toastService.show(`${n.titulo} — ${n.mensaje}`, 'default', 5000)
        );
      }
    });
  }

  async marcarLeida(id: string): Promise<void> {
    await this.notifService.marcarLeida(id);
  }

  async marcarTodasLeidas(): Promise<void> {
    const uid = this.authService.currentUser()?.uid;
    if (!uid) return;
    await this.notifService.marcarTodasLeidas(uid);
  }

  async eliminar(id: string): Promise<void> {
    await this.notifService.eliminar(id);
  }

  async eliminarLeidas(): Promise<void> {
    const uid = this.authService.currentUser()?.uid;
    if (!uid) return;
    await this.notifService.eliminarLeidas(uid);
  }

  async eliminarTodas(): Promise<void> {
    const uid = this.authService.currentUser()?.uid;
    if (!uid) return;
    await this.notifService.eliminarTodas(uid);
  }

  async navegarA(notif: NotificacionAdmin): Promise<void> {
    if (!notif.leida) await this.notifService.marcarLeida(notif.id);
    if (notif.accionUrl) await this.router.navigateByUrl(notif.accionUrl);
  }
}
