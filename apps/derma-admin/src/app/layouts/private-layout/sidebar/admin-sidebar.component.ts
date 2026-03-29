import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { RolUsuario, Usuario } from '@derma/models';

interface NavItem {
  readonly id: string;
  readonly label: string;
  readonly path: string;
  readonly roles: readonly RolUsuario[];
  readonly description?: string;
}

const NAV_ITEMS: readonly NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/admin/dashboard', roles: [RolUsuario.ADMIN, RolUsuario.DERMATOLOGO, RolUsuario.RECEPCIONISTA, RolUsuario.EMPLEADO] },
  { id: 'agenda', label: 'Agenda', path: '/admin/agenda', roles: [RolUsuario.ADMIN, RolUsuario.DERMATOLOGO, RolUsuario.RECEPCIONISTA] },
  { id: 'pacientes', label: 'Pacientes', path: '/admin/pacientes', roles: [RolUsuario.ADMIN, RolUsuario.DERMATOLOGO, RolUsuario.RECEPCIONISTA] },
  { id: 'historial', label: 'Historial', path: '/admin/historial', roles: [RolUsuario.ADMIN, RolUsuario.DERMATOLOGO] },
  { id: 'tratamientos', label: 'Tratamientos', path: '/admin/tratamientos', roles: [RolUsuario.ADMIN, RolUsuario.DERMATOLOGO] },
  { id: 'finanzas', label: 'Finanzas', path: '/admin/finanzas', roles: [RolUsuario.ADMIN] },
  { id: 'staff', label: 'Staff', path: '/admin/staff', roles: [RolUsuario.ADMIN] },
  { id: 'configuracion', label: 'Configuración', path: '/admin/configuracion', roles: [RolUsuario.ADMIN, RolUsuario.DERMATOLOGO, RolUsuario.RECEPCIONISTA, RolUsuario.EMPLEADO] }
];

@Component({
  selector: 'derm-admin-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminSidebarComponent {
  user = input<Usuario | null>();
  open = input<boolean>(false);
  navigate = output<void>();

  readonly visibleItems = computed(() => {
    const role = this.user()?.rol;
    if (!role) return [];
    return NAV_ITEMS.filter(item => item.roles.includes(role));
  });

  onNavigate(): void {
    this.navigate.emit();
  }
}
