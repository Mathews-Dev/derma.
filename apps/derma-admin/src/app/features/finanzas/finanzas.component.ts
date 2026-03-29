import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'derm-finanzas',
  standalone: true,
  templateUrl: './finanzas.component.html',
  styleUrl: './finanzas.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinanzasComponent {}
