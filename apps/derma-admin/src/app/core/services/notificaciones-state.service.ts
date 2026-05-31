import { computed, effect, inject, Injectable } from '@angular/core';

import { toObservable, toSignal } from '@angular/core/rxjs-interop';

import { of, switchMap } from 'rxjs';

import { Router } from '@angular/router';

import { Timestamp } from 'firebase/firestore';

import { AuthService, NotificacionAdminService } from '@derma/firebase';

import { NotificacionAdmin, TipoNotificacionAdmin } from '@derma/models';

import { ToastService, ToastVariant } from '@derma/ui';



/** Margen para considerar una notif “de esta sesión” (reloj / red). */

const MARGEN_SESION_MS = 8_000;



@Injectable()

export class NotificacionesStateService {

  private readonly notifService  = inject(NotificacionAdminService);

  private readonly authService   = inject(AuthService);

  private readonly toastService  = inject(ToastService);

  private readonly router        = inject(Router);



  private readonly sessionStartMs = Date.now();



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

  private baselineLista = false;

  private lastUid: string | null = null;



  constructor() {

    effect(() => {

      const uid = this.authService.currentUser()?.uid ?? null;

      if (uid !== this.lastUid) {

        this.lastUid = uid;

        this.baselineLista = false;

        this.prevIds = new Set();

      }

    });



    effect(() => {

      const current = this._all();



      if (!this.baselineLista) {

        if (current.length === 0) return;

        this.baselineLista = true;

        this.prevIds = new Set(current.map(n => n.id));

        current

          .filter(n => !n.leida && this._creadaEnSesion(n))

          .slice(0, 3)

          .forEach(n => this._toastNotificacion(n));

        return;

      }



      const nuevas = current.filter(n => !n.leida && !this.prevIds.has(n.id));

      this.prevIds = new Set(current.map(n => n.id));



      nuevas.slice(0, 3).forEach(n => this._toastNotificacion(n));

    });

  }



  private _toastNotificacion(n: NotificacionAdmin): void {

    const accionUrl = n.accionUrl;

    const accionTexto = n.accionTexto?.trim();

    this.toastService.show({

      title: n.titulo,

      message: n.mensaje,

      variant: this._variantPorNotificacion(n.tipo, n.prioridad),

      action:

        accionUrl && accionTexto

          ? {

              label: accionTexto,

              onClick: () => void this.navegarA(n),

            }

          : undefined,

    });

  }



  private _variantPorNotificacion(

    tipo: TipoNotificacionAdmin,

    prioridad?: NotificacionAdmin['prioridad'],

  ): ToastVariant {

    if (

      tipo === 'inventario_vencido' ||

      tipo === 'tarea_vencida' ||

      prioridad === 'urgente'

    ) {

      return 'error';

    }

    if (

      tipo === 'inventario_bajo' ||

      tipo === 'inventario_por_vencer' ||

      tipo === 'tarea_por_vencer' ||

      prioridad === 'alta'

    ) {

      return 'warning';

    }

    if (tipo === 'tarea_aprobada' || tipo === 'tarea_completada') {

      return 'success';

    }

    return 'default';

  }



  private _creadaEnSesion(n: NotificacionAdmin): boolean {

    const ms = this._fechaMs(n.fecha);

    return ms >= this.sessionStartMs - MARGEN_SESION_MS;

  }



  private _fechaMs(fecha: Timestamp | undefined): number {

    if (!fecha) return 0;

    if (typeof fecha.toDate === 'function') return fecha.toDate().getTime();

    const sec = (fecha as { seconds?: number }).seconds;

    return typeof sec === 'number' ? sec * 1000 : 0;

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

