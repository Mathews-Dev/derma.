import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'derm-staff',
  standalone: true,
  templateUrl: './staff.component.html',
  styleUrl: './staff.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StaffComponent {}
