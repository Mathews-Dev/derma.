import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Turno, AccionTurno, EstadoTurno, EstadoPago } from '@derma/models';
import { STATUS, PAGO_STATUS } from '@derma/ui';

@Component({
  selector: 'derm-turno-detalle-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './turno-detalle-modal.component.html',
  styleUrl: './turno-detalle-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TurnoDetalleModalComponent {
  turno = input.required<Turno>();

  accion = output<{ accion: AccionTurno; turno: Turno }>();
  close  = output<void>();

  readonly AccionTurno = AccionTurno;
  readonly EstadoTurno = EstadoTurno;
  readonly EstadoPago  = EstadoPago;

  @HostListener('document:keydown.escape')
  onEsc() { this.close.emit(); }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close.emit();
    }
  }

  emitAccion(accion: AccionTurno) {
    this.accion.emit({ accion, turno: this.turno() });
  }

  getEstadoLabel(): string {
    return STATUS[this.turno().estado]?.label ?? this.turno().estado;
  }

  getEstadoColor(): string {
    return STATUS[this.turno().estado]?.color ?? 'var(--c-600)';
  }

  getEstadoBg(): string {
    return STATUS[this.turno().estado]?.bg ?? 'var(--c-100)';
  }

  getPagoLabel(): string {
    return PAGO_STATUS[this.turno().estadoPago]?.label ?? this.turno().estadoPago;
  }

  getPagoColor(): string {
    return PAGO_STATUS[this.turno().estadoPago]?.color ?? 'var(--c-600)';
  }

  getPagoBg(): string {
    return PAGO_STATUS[this.turno().estadoPago]?.bg ?? 'var(--c-100)';
  }

  fmtFecha(ts: any): string {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  fmtMonto(n: number): string {
    return '$\u00a0' + n.toLocaleString('es-AR');
  }

  /** Acciones disponibles según el estado actual del turno. */
  get accionesDisponibles(): { accion: AccionTurno; label: string; icon: string; variant: string }[] {
    const estado = this.turno().estado;
    const actions = [];

    if (estado === EstadoTurno.PENDIENTE) {
      actions.push({ accion: AccionTurno.CONFIRMAR, label: 'Confirmar', icon: 'check', variant: 'primary' });
    }
    if (estado === EstadoTurno.CONFIRMADO) {
      actions.push({ accion: AccionTurno.ATENDER, label: 'Atendido', icon: 'heart', variant: 'primary' });
      actions.push({ accion: AccionTurno.MARCAR_NO_ASISTIO, label: 'No asistió', icon: 'x-circle', variant: 'ghost' });
    }
    if (estado !== EstadoTurno.CANCELADO && estado !== EstadoTurno.ATENDIDO && estado !== EstadoTurno.NO_ASISTIO) {
      actions.push({ accion: AccionTurno.REPROGRAMAR, label: 'Reprogramar', icon: 'calendar', variant: 'ghost' });
      actions.push({ accion: AccionTurno.CANCELAR, label: 'Cancelar', icon: 'trash', variant: 'danger' });
    }
    if (this.turno().estadoPago !== EstadoPago.PAGADO) {
      actions.push({ accion: AccionTurno.REGISTRAR_PAGO, label: 'Registrar pago', icon: 'credit-card', variant: 'success' });
    }

    return actions;
  }
}
