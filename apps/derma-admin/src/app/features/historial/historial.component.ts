import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'derm-historial',
  standalone: true,
  templateUrl: './historial.component.html',
  styleUrl: './historial.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistorialComponent {}
