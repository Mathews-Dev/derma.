import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'derm-pacientes',
  standalone: true,
  templateUrl: './pacientes.component.html',
  styleUrl: './pacientes.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PacientesComponent {}
