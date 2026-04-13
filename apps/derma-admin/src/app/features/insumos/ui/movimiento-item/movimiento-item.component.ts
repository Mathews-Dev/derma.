import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MOTIVO_ENTRADA_LABELS, MOTIVO_SALIDA_LABELS, MovimientoInsumo } from '@derma/models';

@Component({
  selector: 'app-movimiento-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-start gap-3 py-3 border-b border-[var(--paper-dim)] last:border-0">
      <!-- Icon tipo -->
      <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" [class]="iconBg()">
        <svg class="w-4 h-4" [class]="iconColor()" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="iconPath()" />
        </svg>
      </div>

      <!-- Contenido -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between gap-2">
          <p class="text-[12px] font-medium text-[var(--ink)]">{{ tipoLabel() }}</p>
          <span class="text-[11px] font-mono font-semibold" [class]="cantidadClass()">
            {{ mov().tipo === 'salida' ? '-' : '+' }}{{ mov().cantidad }} {{ mov().tipo === 'ajuste' ? '(ajuste)' : '' }}
          </span>
        </div>
        <p class="text-[11px] text-[var(--ink-muted)] mt-0.5">{{ motivoLabel() }}</p>
        <div class="flex items-center gap-2 mt-1">
          <span class="text-[10px] text-[var(--ink-ghost)]">{{ fechaLabel() }}</span>
          <span class="text-[var(--ink-ghost)]">·</span>
          <span class="text-[10px] text-[var(--ink-ghost)]">{{ mov().realizadoPorNombre }}</span>
          <span class="text-[10px] font-mono text-[var(--ink-ghost)]">
            {{ mov().stockAnterior }} → {{ mov().stockResultante }}
          </span>
        </div>
        @if (mov().notas) {
          <p class="text-[11px] text-[var(--ink-muted)] mt-1 italic">{{ mov().notas }}</p>
        }
      </div>
    </div>
  `,
})
export class MovimientoItemComponent {
  mov = input.required<MovimientoInsumo>();

  tipoLabel = computed(() => {
    switch (this.mov().tipo) {
      case 'entrada': return 'Entrada de stock';
      case 'salida':  return 'Salida de stock';
      case 'ajuste':  return 'Ajuste de inventario';
    }
  });

  motivoLabel = computed(() => {
    const m = this.mov();
    if (m.tipo === 'salida' && m.motivoSalida) return MOTIVO_SALIDA_LABELS[m.motivoSalida];
    if (m.tipo === 'entrada' && m.motivoEntrada) return MOTIVO_ENTRADA_LABELS[m.motivoEntrada];
    return '';
  });

  iconBg = computed(() => {
    switch (this.mov().tipo) {
      case 'entrada': return 'bg-emerald-50';
      case 'salida':  return 'bg-red-50';
      case 'ajuste':  return 'bg-amber-50';
    }
  });

  iconColor = computed(() => {
    switch (this.mov().tipo) {
      case 'entrada': return 'text-emerald-600';
      case 'salida':  return 'text-red-600';
      case 'ajuste':  return 'text-amber-600';
    }
  });

  iconPath = computed(() => {
    switch (this.mov().tipo) {
      case 'entrada': return 'M12 4.5v15m7.5-7.5h-15';
      case 'salida':  return 'm19.5 12h-15';
      case 'ajuste':  return 'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99';
    }
  });

  cantidadClass = computed(() => {
    switch (this.mov().tipo) {
      case 'entrada': return 'text-emerald-600';
      case 'salida':  return 'text-red-600';
      case 'ajuste':  return 'text-amber-600';
    }
  });

  fechaLabel = computed(() => {
    const d = this.mov().fecha.toDate();
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`;
  });
}
