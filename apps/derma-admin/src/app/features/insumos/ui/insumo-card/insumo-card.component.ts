import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CATEGORIA_INSUMO_LABELS, Insumo } from '@derma/models';
import { StockIndicatorComponent } from '../stock-indicator/stock-indicator.component';
import { TooltipComponent } from '@derma/ui';

@Component({
  selector: 'app-insumo-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, StockIndicatorComponent, TooltipComponent],
  templateUrl: './insumo-card.component.html',
})
export class InsumoCardComponent {
  insumo = input.required<Insumo>();
  canEdit = input<boolean>(false);

  desactivar = output<string>();

  categoriaLabel = computed(() => CATEGORIA_INSUMO_LABELS[this.insumo().categoria] ?? this.insumo().categoria);

  vencimientoLabel = computed(() => {
    const fv = this.insumo().fechaVencimiento;
    if (!fv) return null;
    const d = fv.toDate();
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`;
  });

  estaVencido = computed(() => {
    const fv = this.insumo().fechaVencimiento;
    return fv ? fv.toDate() < new Date() : false;
  });

  proximoAVencer = computed(() => {
    const fv = this.insumo().fechaVencimiento;
    if (!fv) return false;
    const en30 = new Date();
    en30.setDate(en30.getDate() + 30);
    return fv.toDate() <= en30 && fv.toDate() >= new Date();
  });
}
