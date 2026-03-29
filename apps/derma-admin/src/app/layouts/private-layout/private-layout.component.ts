import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '@derma/firebase';
import { AdminHeaderComponent } from './header/admin-header.component';
import { AdminSidebarComponent } from './sidebar/admin-sidebar.component';

@Component({
  selector: 'derm-private-layout',
  standalone: true,
  imports: [RouterOutlet, AdminHeaderComponent, AdminSidebarComponent],
  templateUrl: './private-layout.component.html',
  styleUrl: './private-layout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrivateLayoutComponent {
  private readonly authService = inject(AuthService);

  readonly user = computed(() => this.authService.currentUser());
  readonly sidebarOpen = signal(false);
  readonly isSidebarCollapsed = signal(false);

  toggleSidebar(): void {
    this.sidebarOpen.update(open => !open);
  }

  toggleSidebarCollapse(): void {
    this.isSidebarCollapsed.update(c => !c);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  async logout(): Promise<void> {
    await this.authService.logOut();
  }
}
