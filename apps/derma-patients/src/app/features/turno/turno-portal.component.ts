import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService, saveAuthReturnUrl } from '@derma/firebase';
import { RolUsuario } from '@derma/models';
import { TurnoPortalDto, TurnoPortalService } from '../../data-access/turno-portal.service';

@Component({
  selector: 'derm-turno-portal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink],
  template: `
    <main class="mx-auto max-w-lg p-6">
      @if (cargando()) {
        <p class="text-slate-600">Cargando turno…</p>
      } @else if (error()) {
        <p class="text-red-600">{{ error() }}</p>
      } @else if (turno(); as t) {
        <h1 class="text-2xl font-semibold text-slate-900">Tu turno en Derma</h1>
        <p class="mt-2 text-slate-700">{{ t.pacienteNombre }}</p>
        <dl class="mt-4 space-y-2 rounded-lg border border-slate-200 bg-white p-4">
          <div><dt class="text-sm text-slate-500">Fecha</dt><dd>{{ t.fecha | date:'fullDate':'':'es-AR' }}</dd></div>
          <div><dt class="text-sm text-slate-500">Hora</dt><dd>{{ t.horaInicio }} – {{ t.horaFin }}</dd></div>
          <div><dt class="text-sm text-slate-500">Profesional</dt><dd>{{ t.profesionalNombre }}</dd></div>
          <div><dt class="text-sm text-slate-500">Estado</dt><dd>{{ t.estado }}</dd></div>
        </dl>
        <p class="mt-4 text-sm text-slate-600">{{ t.mensajePolitica }}</p>

        @if (!auth.isLoggedIn()) {
          <p class="mt-4 text-sm">Para cancelar o gestionar el turno, iniciá sesión.</p>
          <a
            class="mt-3 inline-block text-blue-700 underline"
            [routerLink]="['/auth/login']"
            [queryParams]="{ returnUrl: returnUrlPath() }"
          >Iniciar sesión</a>
        } @else if (!esMiTurno()) {
          <p class="mt-4 text-amber-700 text-sm">Esta cuenta no coincide con el paciente del turno. Contactá a recepción.</p>
        } @else if (t.puedeModificar) {
          <div class="mt-6 flex flex-col gap-3">
            <button
              type="button"
              class="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              [disabled]="cancelando()"
              (click)="confirmarCancelacion()"
            >Cancelar turno</button>
            <a class="text-center text-blue-700 underline" routerLink="/reprogramar">Sacar otro turno (nuevo pago)</a>
          </div>
        } @else {
          <a class="mt-4 inline-block text-blue-700 underline" routerLink="/reprogramar">Sacar nuevo turno</a>
        }

        @if (mensajeAccion()) {
          <p class="mt-4 text-sm" [class.text-green-700]="exito()" [class.text-red-600]="!exito()">{{ mensajeAccion() }}</p>
        }
      }
    </main>
  `,
})
export class TurnoPortalComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly portal = inject(TurnoPortalService);
  readonly auth = inject(AuthService);

  readonly accessToken = signal('');
  readonly turno = signal<TurnoPortalDto | null>(null);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly cancelando = signal(false);
  readonly mensajeAccion = signal<string | null>(null);
  readonly exito = signal(false);

  readonly returnUrlPath = computed(() => `/t/${this.accessToken()}`);

  readonly esMiTurno = computed(() => {
    const user = this.auth.currentUser();
    const t = this.turno();
    if (!user || !t) return false;
    return user.rol === RolUsuario.PACIENTE && user.uid === t.pacienteId;
  });

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('accessToken') ?? '';
    this.accessToken.set(token);
    saveAuthReturnUrl(`/t/${token}`);
    this.portal.obtenerPorToken(token).subscribe({
      next: res => {
        this.turno.set(res.turno);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No encontramos este turno. Verificá el link de WhatsApp.');
        this.cargando.set(false);
      },
    });
  }

  confirmarCancelacion(): void {
    const t = this.turno();
    const user = this.auth.currentUser();
    if (!t || !user || !this.esMiTurno()) return;
    if (!confirm('¿Confirmás la cancelación de este turno?')) return;
    this.cancelando.set(true);
    this.mensajeAccion.set(null);
    this.portal.cancelar(this.accessToken(), 'Cancelado por el paciente', user.uid).subscribe({
      next: () => {
        this.exito.set(true);
        this.mensajeAccion.set('Turno cancelado correctamente.');
        this.cancelando.set(false);
        this.recargar();
      },
      error: err => {
        this.exito.set(false);
        const msg = err?.error?.error ?? 'No se pudo cancelar el turno.';
        this.mensajeAccion.set(msg);
        this.cancelando.set(false);
      },
    });
  }

  private recargar(): void {
    this.portal.obtenerPorToken(this.accessToken()).subscribe({
      next: res => this.turno.set(res.turno),
    });
  }
}
