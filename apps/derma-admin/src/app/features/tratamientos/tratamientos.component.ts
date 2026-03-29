import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'derm-tratamientos',
  standalone: true,
  templateUrl: './tratamientos.component.html',
  styleUrl: './tratamientos.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TratamientosComponent {}
