import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { EstadoStock, Insumo, getEstadoStock } from '@derma/models';

@Component({
  selector: 'app-stock-indicator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-bold uppercase tracking-widest"
      [class]="badgeClasses()"
    >
      <span class="size-1.5 rounded-full" [class]="dotClass()"></span>
      {{ label() }}
    </span>
  `,
})
export class StockIndicatorComponent {
  insumo = input.required<Pick<Insumo, 'stockActual' | 'stockMinimo'>>();

  estado = computed<EstadoStock>(() => getEstadoStock(this.insumo()));

  label = computed(() => {
    switch (this.estado()) {
      case 'sin_stock':   return 'Sin stock';
      case 'bajo_minimo': return 'Stock bajo';
      default:            return 'OK';
    }
  });

  badgeClasses = computed(() => {
    switch (this.estado()) {
      case 'sin_stock':   return 'bg-red-50 border-red-200 text-red-700';
      case 'bajo_minimo': return 'bg-amber-50 border-amber-200 text-amber-700';
      default:            return 'bg-[var(--c-800)] border-[var(--c-800)] text-[var(--c-50)]';
    }
  });

  dotClass = computed(() => {
    switch (this.estado()) {
      case 'sin_stock':   return 'bg-red-500';
      case 'bajo_minimo': return 'bg-amber-400';
      default:            return 'bg-emerald-400';
    }
  });
}
