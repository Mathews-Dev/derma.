import { ChangeDetectionStrategy, Component, HostListener, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Turno } from '@derma/models';

type TipoPago = 'efectivo' | 'mercado_pago';

@Component({
  selector: 'derm-turno-pago-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './turno-pago-modal.component.html',
  styleUrl: './turno-pago-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
// Force IDE cache refresh
export class TurnoPagoModalComponent {
  turno   = input.required<Turno>();
  confirm = output<{ tipo: TipoPago; monto: number }>();
  close   = output<void>();

  tipoPago = signal<TipoPago>('efectivo');
  monto    = signal(0);

  ngOnInit() {
    this.monto.set(this.turno().monto);
  }

  @HostListener('document:keydown.escape') onEsc() { this.close.emit(); }

  get canConfirm() { return this.monto() > 0; }

  setTipo(t: TipoPago) { this.tipoPago.set(t); }

  onConfirm() {
    if (!this.canConfirm) return;
    this.confirm.emit({ tipo: this.tipoPago(), monto: this.monto() });
  }

  fmtMonto(n: number) { return '$\u00a0' + n.toLocaleString('es-AR'); }
}
