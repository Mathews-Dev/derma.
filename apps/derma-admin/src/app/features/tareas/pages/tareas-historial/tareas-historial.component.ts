import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DocumentSnapshot } from '@angular/fire/firestore';
import { AuthService, HistorialFiltros, TareasService } from '@derma/firebase';
import {
  CATEGORIA_LABELS,
  CategoriaTarea,
  EstadoTarea,
  Tarea,
  Usuario,
} from '@derma/models';
import {
  DatepickerComponent,
  ToastService,
  UiDropdownSelectComponent,
  UiLoaderCardComponent,
  UiPageHeaderComponent,
  UiPaginationComponent,
} from '@derma/ui';

@Component({
  selector: 'app-tareas-historial',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    UiPageHeaderComponent,
    UiLoaderCardComponent,
    UiDropdownSelectComponent,
    DatepickerComponent,
    UiPaginationComponent,
  ],
  templateUrl: './tareas-historial.component.html',
  styleUrl: './tareas-historial.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TareasHistorialComponent implements OnInit {
  private readonly tareasService = inject(TareasService);
  private readonly authService   = inject(AuthService);
  private readonly toast         = inject(ToastService);

  readonly EstadoTarea    = EstadoTarea;
  readonly CATEGORIA_LABELS = CATEGORIA_LABELS;

  isLoading    = signal(false);
  tareas       = signal<Tarea[]>([]); // These are all tasks
  currentPage  = signal(1);
  readonly pageSize = 10;
  totalItems   = signal(0);

  paginatedTareas = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.tareas().slice(start, start + this.pageSize);
  });

  empleados    = signal<Usuario[]>([]);

  tareaAEliminar = signal<Tarea | null>(null);

  adminUid = computed(() => this.authService.currentUser()?.uid ?? '');

  // Filtros
  filtroEmpleado  = signal('');
  filtroEstado    = signal<EstadoTarea | ''>('');
  filtroCategoria = signal<CategoriaTarea | ''>('');
  filtroDesde     = signal('');  // string yyyy-mm-dd
  filtroHasta     = signal('');

  readonly ESTADOS_TERMINALES = [
    EstadoTarea.COMPLETADA,
    EstadoTarea.CANCELADA,
    EstadoTarea.VENCIDA,
  ];

  readonly CATEGORIAS = Object.keys(CATEGORIA_LABELS) as CategoriaTarea[];

  // Opciones para UI
  nombresEmpleados = computed(() => this.empleados().map(emp => ({ id: emp.uid, label: `${emp.nombre} ${emp.apellido}` })));
  estadosUI = computed(() => this.ESTADOS_TERMINALES.map(e => ({ id: e, label: this.estadoLabel(e) })));
  categoriasUI = computed(() => this.CATEGORIAS.map(c => ({ id: c, label: CATEGORIA_LABELS[c] })));

  desdeDate = computed(() => {
    const val = this.filtroDesde();
    if (!val) return null;
    return new Date(val + 'T00:00:00');
  });

  hastaDate = computed(() => {
    const val = this.filtroHasta();
    if (!val) return null;
    return new Date(val + 'T00:00:00');
  });

  onDesdeChange(date: Date | null) {
    if (!date) {
      this.filtroDesde.set('');
      return;
    }
    const localDate = new Date(date.getTime());
    this.filtroDesde.set(`${localDate.getFullYear()}-${String(localDate.getMonth()+1).padStart(2,'0')}-${String(localDate.getDate()).padStart(2,'0')}`);
  }

  onHastaChange(date: Date | null) {
    if (!date) {
      this.filtroHasta.set('');
      return;
    }
    const localDate = new Date(date.getTime());
    this.filtroHasta.set(`${localDate.getFullYear()}-${String(localDate.getMonth()+1).padStart(2,'0')}-${String(localDate.getDate()).padStart(2,'0')}`);
  }

  ngOnInit(): void {
    this.cargarEmpleados();
    this.cargarPagina(true);
  }

  private cargarEmpleados(): void {
    this.tareasService.getEmpleados().subscribe({
      next: users => this.empleados.set(users.filter(TareasService.esAsignable)),
    });
  }

  async cargarPagina(reset = false): Promise<void> {
    if (this.isLoading()) return;
    this.isLoading.set(true);

    if (reset) {
      this.tareas.set([]);
      this.currentPage.set(1);
    }

    const filtros: HistorialFiltros = {
      empleadoUid: this.filtroEmpleado() || undefined,
      estado:      (this.filtroEstado() as EstadoTarea) || undefined,
      categoria:   (this.filtroCategoria() as CategoriaTarea) || undefined,
      desde:       this.filtroDesde() ? new Date(this.filtroDesde() + 'T00:00:00') : undefined,
      hasta:       this.filtroHasta() ? new Date(this.filtroHasta() + 'T23:59:59') : undefined,
    };

    try {
      const result = await this.tareasService.getHistorialPaginado(filtros);
      this.tareas.set(result.tareas);
      this.totalItems.set(result.tareas.length);
    } catch (error) {
      console.log(error);
      this.toast.error('Error al cargar el historial');
    } finally {
      this.isLoading.set(false);
    }
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  aplicarFiltros(): void {
    this.cargarPagina(true);
  }

  limpiarFiltros(): void {
    this.filtroEmpleado.set('');
    this.filtroEstado.set('');
    this.filtroCategoria.set('');
    this.filtroDesde.set('');
    this.filtroHasta.set('');
    this.cargarPagina(true);
  }

  async restaurar(tarea: Tarea): Promise<void> {
    try {
      await this.tareasService.restaurar(tarea.id);
      this.tareas.update(list => list.filter(t => t.id !== tarea.id));
      this.toast.success(`"${tarea.titulo}" restaurada al Kanban`);
    } catch {
      this.toast.error('No se pudo restaurar la tarea');
    }
  }

  confirmarEliminar(tarea: Tarea): void {
    this.tareaAEliminar.set(tarea);
  }

  async eliminarPermanente(): Promise<void> {
    const tarea = this.tareaAEliminar();
    if (!tarea) return;
    try {
      await this.tareasService.eliminar(tarea.id);
      this.tareas.update(list => list.filter(t => t.id !== tarea.id));
      this.toast.success('Tarea eliminada permanentemente');
    } catch {
      this.toast.error('Error al eliminar');
    } finally {
      this.tareaAEliminar.set(null);
    }
  }

  estadoLabel(e: EstadoTarea): string {
    return TareasService.estadoLabel(e);
  }

  estadoBadgeClass(e: EstadoTarea): string {
    switch (e) {
      case EstadoTarea.COMPLETADA:  return 'bg-emerald-100 text-emerald-700';
      case EstadoTarea.CANCELADA:   return 'bg-red-100 text-red-700';
      case EstadoTarea.VENCIDA:     return 'bg-amber-100 text-amber-700';
      default:                      return 'bg-[var(--c-100)] text-[var(--c-600)]';
    }
  }

  filtrosActivos = computed(() =>
    !!(this.filtroEmpleado() || this.filtroEstado() || this.filtroCategoria() || this.filtroDesde() || this.filtroHasta())
  );
}
