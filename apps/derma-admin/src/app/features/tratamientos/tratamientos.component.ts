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
import { TratamientosService } from '@derma/firebase';
import {
  CategoriaTratamiento,
  EstadoTratamiento,
  Tratamiento,
} from '@derma/models';
import { DecimalPipe } from '@angular/common';
import {
  UiBadgeComponent,
  UiEmptyStateComponent,
  UiLoaderCardComponent,
  UiPageHeaderComponent,
  UiPaginationComponent,
  ToastService,
  TooltipComponent,
  UiDropdownSelectComponent,
  SelectOption,
} from '@derma/ui';

@Component({
  selector: 'derm-tratamientos',
  standalone: true,
  imports: [
    DecimalPipe,
    UiPageHeaderComponent,
    UiPaginationComponent,
    UiLoaderCardComponent,
    UiEmptyStateComponent,
    TooltipComponent,
    UiDropdownSelectComponent,
  ],
  templateUrl: './tratamientos.component.html',
  styleUrl: './tratamientos.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TratamientosComponent implements OnInit, OnDestroy {
  private readonly tratamientosService = inject(TratamientosService);
  private readonly toastService        = inject(ToastService);
  private readonly router              = inject(Router);
  private readonly destroy$            = new Subject<void>();

  readonly EstadoTratamiento = EstadoTratamiento;

  isLoading       = signal(true);
  terminoBusqueda = signal('');
  currentPage     = signal(1);
  readonly pageSize = 10;

  selectedCategoria = signal<CategoriaTratamiento | null>(null);
  selectedEstado    = signal<EstadoTratamiento | null>(null);

  allTratamientos = signal<Tratamiento[]>([]);

  readonly categoriaOptions: SelectOption[] = [
    { id: '',           label: 'Todas las categorías' },
    { id: 'facial',     label: 'Facial'     },
    { id: 'corporal',   label: 'Corporal'   },
    { id: 'piel',       label: 'Piel'       },
    { id: 'capilar',    label: 'Capilar'    },
    { id: 'bienestar',  label: 'Bienestar'  },
    { id: 'quirurgico', label: 'Quirúrgico' },
    { id: 'otro',       label: 'Otro'       },
  ];

  readonly estadoOptions: SelectOption[] = [
    { id: '',                          label: 'Todos los estados' },
    { id: EstadoTratamiento.ACTIVO,    label: 'Activo'    },
    { id: EstadoTratamiento.BORRADOR,  label: 'Borrador'  },
    { id: EstadoTratamiento.ARCHIVADO, label: 'Archivado' },
  ];

  private normalizarTexto(texto?: string): string {
    if (!texto) return '';
    return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  filteredTratamientos = computed(() => {
    const todos     = this.allTratamientos();
    const termino   = this.normalizarTexto(this.terminoBusqueda());
    const categoria = this.selectedCategoria();
    const estado    = this.selectedEstado();

    return todos.filter(t => {
      if (categoria && t.categoria !== categoria) return false;
      if (estado && t.estado !== estado) return false;
      if (termino) {
        const haystack = [
          t.nombre,
          t.categoria,
          t.descripcionCorta,
          ...(t.etiquetas ?? []),
        ].map(s => this.normalizarTexto(s)).join(' ');
        if (!haystack.includes(termino)) return false;
      }
      return true;
    });
  });

  totalTratamientos = computed(() => this.filteredTratamientos().length);

  paginatedTratamientos = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredTratamientos().slice(start, start + this.pageSize);
  });

  ngOnInit(): void {
    this.loadTratamientos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadTratamientos(): void {
    this.isLoading.set(true);
    this.tratamientosService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => {
          this.allTratamientos.set(data);
          this.isLoading.set(false);
        },
        error: () => {
          this.toastService.show('Error al cargar los tratamientos', 'error');
          this.isLoading.set(false);
        },
      });
  }

  onBusquedaChange(event: Event): void {
    this.terminoBusqueda.set((event.target as HTMLInputElement).value);
    this.currentPage.set(1);
  }

  onCategoriaChange(option: SelectOption): void {
    const val = option.id as string;
    this.selectedCategoria.set(val ? (val as CategoriaTratamiento) : null);
    this.currentPage.set(1);
  }

  onEstadoChange(option: SelectOption): void {
    this.selectedEstado.set((option.id as EstadoTratamiento) || null);
    this.currentPage.set(1);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  nuevoTratamiento(): void {
    this.router.navigate(['/admin/tratamientos/nuevo']);
  }

  editarTratamiento(t: Tratamiento): void {
    this.router.navigate(['/admin/tratamientos', t.id]);
  }

  async toggleDestacado(t: Tratamiento): Promise<void> {
    try {
      await this.tratamientosService.update(t.id, { destacado: !t.destacado });
      this.toastService.show(
        t.destacado ? 'Tratamiento quitado de destacados' : 'Tratamiento marcado como destacado',
        'success',
      );
    } catch {
      this.toastService.show('Error al actualizar el tratamiento', 'error');
    }
  }

  async archivarTratamiento(t: Tratamiento): Promise<void> {
    try {
      await this.tratamientosService.archivar(t.id);
      this.toastService.show('Tratamiento archivado', 'success');
    } catch {
      this.toastService.show('Error al archivar el tratamiento', 'error');
    }
  }

  async activarTratamiento(t: Tratamiento): Promise<void> {
    try {
      await this.tratamientosService.update(t.id, { estado: EstadoTratamiento.ACTIVO });
      this.toastService.show('Tratamiento activado', 'success');
    } catch {
      this.toastService.show('Error al activar el tratamiento', 'error');
    }
  }
}

