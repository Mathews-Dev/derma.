import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'derm-configuracion',
  standalone: true,
  templateUrl: './configuracion.component.html',
  styleUrl: './configuracion.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfiguracionComponent {}
