import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EstadoPago, Turno } from '@derma/models';
import { PAGO_STATUS } from '@derma/ui';

export interface TurnoCancelarConfirmPayload {
  motivo: string;
}

const DS_FULL = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

@Component({
  selector: 'derm-turno-cancelar-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './turno-cancelar-modal.component.html',
  styleUrl: './turno-cancelar-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TurnoCancelarModalComponent {
  turno = input.required<Turno>();
  guardando = input(false);

  confirm = output<TurnoCancelarConfirmPayload>();
  close = output<void>();

  motivo = signal('');

  turnoResumen = computed(() => {
    const t = this.turno();
    const d = t.fecha.toDate();
    return `${DS_FULL[d.getDay()]} ${d.getDate()} ${MS_SHORT[d.getMonth()]} · ${t.horaInicio}–${t.horaFin}`;
  });

  pagoLabel = computed(() => {
    const ep = this.turno().estadoPago;
    return PAGO_STATUS[ep]?.label ?? ep;
  });

  pagoYaRealizado = computed(() => {
    const ep = this.turno().estadoPago;
    return ep === EstadoPago.PAGADO || ep === EstadoPago.PARCIAL;
  });

  puedeConfirmar = computed(
    () => this.motivo().trim().length >= 5 && !this.guardando(),
  );

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (!this.guardando()) this.close.emit();
  }

  onConfirm(): void {
    if (!this.puedeConfirmar()) return;
    this.confirm.emit({ motivo: this.motivo().trim() });
  }
}
