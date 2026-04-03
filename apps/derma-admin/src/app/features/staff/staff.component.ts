import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService, FirestoreService } from '@derma/firebase';
import { EstadoUsuario, RolUsuario, Usuario } from '@derma/models';
import {
  UiBadgeComponent,
  UiEmptyStateComponent,
  UiLoaderCardComponent,
  UiPageHeaderComponent,
  UiPaginationComponent,
  ToastService,
  TooltipComponent,
} from '@derma/ui';
import { DeleteProfileModalComponent } from '@derma/ui';

@Component({
  selector: 'derm-staff',
  standalone: true,
  imports: [
    UiPageHeaderComponent,
    UiPaginationComponent,
    UiBadgeComponent,
    UiLoaderCardComponent,
    UiEmptyStateComponent,
    DeleteProfileModalComponent,
    TooltipComponent,
  ],
  templateUrl: './staff.component.html',
  styleUrl: './staff.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaffComponent implements OnInit, OnDestroy {
  private readonly firestoreService = inject(FirestoreService);
  private readonly authService      = inject(AuthService);
  private readonly toastService     = inject(ToastService);
  private readonly router           = inject(Router);
  private readonly destroy$         = new Subject<void>();

  readonly RolUsuario    = RolUsuario;
  readonly EstadoUsuario = EstadoUsuario;

  isAdmin = computed(() => this.authService.currentUser()?.rol === RolUsuario.ADMIN);

  isLoading = signal(true);
  terminoBusqueda = signal('');
  currentPage = signal(1);
  readonly pageSize = 8;

  allUsuarios = signal<Usuario[]>([]);

  modalOpen = signal(false);
  usuarioSeleccionado = signal<Usuario | null>(null);

  private normalizarTexto(texto?: string): string {
    if (!texto) return '';
    return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  filteredUsuarios = computed(() => {
    const todos = this.allUsuarios();
    const termino = this.normalizarTexto(this.terminoBusqueda());
    if (!termino) return todos;
    return todos.filter(u => {
      const full = `${u.nombre} ${u.apellido}`;
      return (
        this.normalizarTexto(full).includes(termino) ||
        this.normalizarTexto(u.email).includes(termino) ||
        this.normalizarTexto(u.rol).includes(termino) ||
        this.normalizarTexto(u.telefono).includes(termino)
      );
    });
  });

  totalUsuarios = computed(() => this.filteredUsuarios().length);

  paginatedUsuarios = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredUsuarios().slice(start, start + this.pageSize);
  });

  ngOnInit(): void {
    this.loadUsuarios();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUsuarios(): void {
    this.isLoading.set(true);
    const rolesPermitidos = [
      RolUsuario.ADMIN,
      RolUsuario.DERMATOLOGO,
      RolUsuario.RECEPCIONISTA,
      RolUsuario.EMPLEADO,
    ];
    this.firestoreService
      .getCollection<Usuario>('usuarios')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => {
          const filtrados = (data || []).filter(u => rolesPermitidos.includes(u.rol));
          this.allUsuarios.set(filtrados);
          this.isLoading.set(false);
        },
        error: () => {
          this.toastService.error('Error al cargar usuarios');
          this.isLoading.set(false);
        },
      });
  }

  onBusquedaChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.terminoBusqueda.set(input.value);
    this.currentPage.set(1);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  editarUsuario(usuario: Usuario): void {
    const route = usuario.rol === RolUsuario.DERMATOLOGO
      ? '/admin/staff/editar-profesional'
      : '/admin/staff/editar';
    this.router.navigate([route, usuario.uid]);
  }

  confirmarDesactivar(usuario: Usuario): void {
    this.usuarioSeleccionado.set(usuario);
    this.modalOpen.set(true);
  }

  async onConfirmDesactivar(): Promise<void> {
    const usuario = this.usuarioSeleccionado();
    if (!usuario) return;
    try {
      await this.firestoreService.updateDocument('usuarios', usuario.uid, {
        estado: EstadoUsuario.INACTIVO,
      });
      this.allUsuarios.update(list =>
        list.map(u => (u.uid === usuario.uid ? { ...u, estado: EstadoUsuario.INACTIVO } : u)),
      );
      this.toastService.success(`${usuario.nombre} desactivado`);
    } catch {
      this.toastService.error('Error al desactivar el usuario');
    } finally {
      this.modalOpen.set(false);
      this.usuarioSeleccionado.set(null);
    }
  }

  async toggleEstado(usuario: Usuario): Promise<void> {
    const nuevoEstado =
      usuario.estado === EstadoUsuario.ACTIVO ? EstadoUsuario.INACTIVO : EstadoUsuario.ACTIVO;
    try {
      await this.firestoreService.updateDocument('usuarios', usuario.uid, { estado: nuevoEstado });
      this.allUsuarios.update(list =>
        list.map(u => (u.uid === usuario.uid ? { ...u, estado: nuevoEstado } : u)),
      );
      this.toastService.success(
        nuevoEstado === EstadoUsuario.ACTIVO
          ? `${usuario.nombre} activado`
          : `${usuario.nombre} desactivado`,
      );
    } catch {
      this.toastService.error('Error al actualizar estado');
    }
  }

  badgeStatus(estado: EstadoUsuario): 'success' | 'neutral' | 'warning' | 'danger' {
    switch (estado) {
      case EstadoUsuario.ACTIVO:    return 'success';
      case EstadoUsuario.INACTIVO:  return 'neutral';
      case EstadoUsuario.SUSPENDIDO: return 'warning';
      default: return 'neutral';
    }
  }
}
