import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { RolUsuario, Usuario } from '@derma/models';

@Component({
  selector: 'derm-admin-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-header.component.html',
  styleUrl: './admin-header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'closeUserMenu($event)'
  }
})
export class AdminHeaderComponent {
  private router = inject(Router);

  user = input<Usuario | null>(null);
  sidebarOpen = input<boolean>(false);
  isSidebarCollapsed = input<boolean>(false);

  toggleSidebar = output<void>();
  logout = output<void>();

  isUserMenuOpen = signal(false);

  readonly profileRoute = computed(() => {
    const u = this.user();
    if (!u) return null;
    return u.rol === RolUsuario.DERMATOLOGO
      ? ['/admin/perfil/profesional']
      : ['/admin/perfil', u.uid];
  });

  breadcrumbs = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(event => this.createBreadcrumbs(event.urlAfterRedirects))
    ),
    { initialValue: this.createBreadcrumbs(this.router.url) }
  );

  private createBreadcrumbs(url: string) {
    const urlWithoutQuery = url.split('?')[0];
    // Ignoramos el segmento 'admin' para que no aparezca en las migas
    const pathSegments = urlWithoutQuery.split('/').filter(segment => segment && segment !== 'admin');
    
    let currentUrl = '/admin';
    
    return pathSegments.map(segment => {
      currentUrl += `/${segment}`;
      return {
        label: segment.replace(/-/g, ' '), // Convertimos guiones a espacios ('nuevo-paciente' -> 'nuevo paciente')
        url: currentUrl
      };
    });
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  toggleUserMenu(event: Event): void {
    event.stopPropagation();
    this.isUserMenuOpen.update(v => !v);
  }

  closeUserMenu(event: Event): void {
    // If clicking outside, this host listener will catch it
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu-container')) {
      this.isUserMenuOpen.set(false);
    }
  }

  onLogout(): void {
    this.logout.emit();
  }
}
