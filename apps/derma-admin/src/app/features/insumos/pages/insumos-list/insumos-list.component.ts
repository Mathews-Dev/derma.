import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { InsumosService } from '@derma/firebase';
import { AuthService } from '@derma/firebase';
import {
  CATEGORIA_INSUMO_LABELS,
  CategoriaInsumo,
  Insumo,
  RolUsuario,
  getEstadoStock,
} from '@derma/models';
import { UiPageHeaderComponent, UiEmptyStateComponent } from '@derma/ui';
import { UiDropdownSelectComponent, SelectOption } from '@derma/ui';
import { InsumoCardComponent } from '../../ui/insumo-card/insumo-card.component';
import { AlertasInsumosService } from '../../data-access/alertas-insumos.service';

type FiltroEstado = 'todos' | 'ok' | 'bajo_minimo' | 'sin_stock';

@Component({
  selector: 'app-insumos-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, UiPageHeaderComponent, UiEmptyStateComponent, InsumoCardComponent, UiDropdownSelectComponent],
  templateUrl: './insumos-list.component.html',
})
export class InsumosListComponent {
  private readonly insumosService  = inject(InsumosService);
  private readonly authService     = inject(AuthService);
  private readonly alertasService  = inject(AlertasInsumosService);

  readonly CATEGORIA_LABELS = CATEGORIA_INSUMO_LABELS;

  private readonly _insumos = toSignal(this.insumosService.getAll(), { initialValue: [] as Insumo[] });

  readonly busqueda        = signal('');
  readonly filtroCategoria = signal<string>('');
  readonly filtroEstado    = signal<FiltroEstado>('todos');

  readonly canEdit = computed(() => {
    const rol = this.authService.currentUser()?.rol;
    return rol === RolUsuario.ADMIN || rol === RolUsuario.DERMATOLOGO || rol === RolUsuario.RECEPCIONISTA;
  });

  readonly categoriaOptions = computed((): SelectOption[] => [
    { id: '', label: 'Todas las categorías' },
    ...Object.entries(CATEGORIA_INSUMO_LABELS).map(([id, label]) => ({ id, label })),
  ]);

  readonly insumosFiltrados = computed(() => {
    const q         = this.busqueda().toLowerCase().trim();
    const categoria = this.filtroCategoria();
    const estado    = this.filtroEstado();

    return this._insumos().filter(insumo => {
      if (q && !insumo.nombre.toLowerCase().includes(q) && !(insumo.codigo?.toLowerCase().includes(q))) {
        return false;
      }
      if (categoria && insumo.categoria !== categoria) return false;
      if (estado !== 'todos' && getEstadoStock(insumo) !== estado) return false;
      return true;
    });
  });

  readonly contadores = computed(() => {
    const all = this._insumos();
    return {
      total:       all.length,
      bajos:       all.filter(i => getEstadoStock(i) === 'bajo_minimo').length,
      sinStock:    all.filter(i => getEstadoStock(i) === 'sin_stock').length,
      porVencer:   all.filter(i => {
        if (!i.fechaVencimiento) return false;
        const en30 = new Date(); en30.setDate(en30.getDate() + 30);
        return i.fechaVencimiento.toDate() <= en30;
      }).length,
    };
  });

  constructor() {
    this.alertasService.verificar().catch(() => {/* fire & forget */});
  }
}
