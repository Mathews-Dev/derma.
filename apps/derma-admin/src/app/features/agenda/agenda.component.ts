import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'derm-agenda',
  standalone: true,
  templateUrl: './agenda.component.html',
  styleUrl: './agenda.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AgendaComponent {}
