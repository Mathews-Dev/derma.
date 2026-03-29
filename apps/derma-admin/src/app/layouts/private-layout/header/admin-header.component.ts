import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Usuario } from '@derma/models';

@Component({
  selector: 'derm-admin-header',
  standalone: true,
  imports: [],
  templateUrl: './admin-header.component.html',
  styleUrl: './admin-header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminHeaderComponent {
  user = input<Usuario | null>(null);
  sidebarOpen = input<boolean>(false);

  toggleSidebar = output<void>();
  logout = output<void>();

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  onLogout(): void {
    this.logout.emit();
  }
}
