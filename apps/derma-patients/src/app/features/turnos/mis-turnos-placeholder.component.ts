import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'derm-mis-turnos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <main class="mx-auto max-w-lg p-6">
      <h1 class="text-2xl font-semibold">Mis turnos</h1>
      <p class="mt-4 text-slate-600">Próximamente verás aquí tu historial de turnos.</p>
      <a routerLink="/reprogramar" class="mt-4 inline-block text-blue-700 underline">Sacar nuevo turno</a>
    </main>
  `,
})
export class MisTurnosPlaceholderComponent {}
