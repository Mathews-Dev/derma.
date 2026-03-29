import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'derm-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {}
