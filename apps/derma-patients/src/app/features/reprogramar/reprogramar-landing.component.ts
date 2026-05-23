import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'derm-reprogramar-landing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <main class="mx-auto max-w-lg p-6">
      <h1 class="text-2xl font-semibold text-slate-900">Nuevo turno</h1>
      <p class="mt-4 text-slate-600">
        Para reservar una nueva cita, iniciá sesión o contactá a recepción.
        Los turnos requieren pago al momento de la reserva.
      </p>
      <a class="mt-6 inline-block text-blue-700 underline" routerLink="/auth/login">Iniciar sesión</a>
    </main>
  `,
})
export class ReprogramarLandingComponent {}
