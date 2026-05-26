import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '@derma/firebase';
import { LayoutStateService } from '../../core/services/layout-state.service';
import { AdminHeaderComponent } from './header/admin-header.component';
import { AdminSidebarComponent } from './sidebar/admin-sidebar.component';
import { LoadingService } from '@derma/ui';
import { InventarioAlertasSyncService } from '../../core/services/inventario-alertas-sync.service';

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
  private readonly layoutState = inject(LayoutStateService);
  private readonly loadingService = inject(LoadingService);

  readonly user = computed(() => this.authService.currentUser());

  constructor() {
    inject(InventarioAlertasSyncService);
  }
  readonly sidebarOpen = signal(false);
  readonly isSidebarCollapsed = this.layoutState.isSidebarCollapsed;

  toggleSidebar(): void {
    this.sidebarOpen.update(open => !open);
  }

  toggleSidebarCollapse(): void {
    this.layoutState.toggle();
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  async logout(): Promise<void> {
    await this.loadingService.showWhile(this.authService.logOut());
  }
}
