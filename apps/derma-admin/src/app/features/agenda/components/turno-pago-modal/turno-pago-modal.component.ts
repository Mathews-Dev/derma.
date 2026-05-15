import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Turno } from '@derma/models';

type TipoPago = 'efectivo' | 'mercado_pago';

export type TurnoPagoMpPhase = 'idle' | 'creating' | 'ready' | 'error';

export interface TurnoPagoMpCheckout {
  qr_code_base64: string | null;
  init_point: string;
  external_reference: string;
}

/** Número final a usar en Meta (principal corregido o alternativo). */
export interface TurnoPagoWhatsappPayload {
  enviar: boolean;
  telefono: string;
}

export interface TurnoPagoConfirmPayload {
  tipo: TipoPago;
  monto: number;
  email?: string;
  whatsapp?: TurnoPagoWhatsappPayload;
}

@Component({
  selector: 'derm-turno-pago-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './turno-pago-modal.component.html',
  styleUrl: './turno-pago-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TurnoPagoModalComponent {
  turno = input.required<Turno>();
  confirm = output<TurnoPagoConfirmPayload>();
  close = output<void>();

  /** Estado del checkout MP controlado por el padre (POST /api/payment + polling). */
  mpPhase = input<TurnoPagoMpPhase>('idle');
  mpCheckout = input<TurnoPagoMpCheckout | null>(null);
  mpError = input<string | null>(null);

  tipoPago = signal<TipoPago>('efectivo');
  monto = linkedSignal(() => this.turno().monto);
  emailMp = signal('');

  /** Teléfono que mostramos a la recepcionista para confirmar con el paciente (editable). */
  telefonoPrincipal = linkedSignal(() => telefonoDefaultDesdeTurno(this.turno()));
  notificarPorWhatsapp = signal(false);
  usarOtroNumeroWhatsapp = signal(false);
  telefonoAlternativo = signal('');

  telefonoResueltoParaEnvio = computed(() => {
    if (!this.notificarPorWhatsapp()) return '';
    if (this.usarOtroNumeroWhatsapp()) return this.telefonoAlternativo().trim();
    return this.telefonoPrincipal().trim();
  });

  whatsappBloqueaConfirmar = computed(() => {
    if (!this.notificarPorWhatsapp()) return false;
    const tel = this.telefonoResueltoParaEnvio();
    return !tel || contarDigitos(tel) < 8;
  });

  emailMissing = computed(
    () =>
      this.tipoPago() === 'mercado_pago' &&
      !this.emailToUse().includes('@'),
  );

  emailToUse = computed(() => {
    const fromTurno = this.turno().pacienteEmail?.trim() ?? '';
    const fromInput = this.emailMp().trim();
    return fromTurno.includes('@') ? fromTurno : fromInput;
  });

  puedeConfirmar = computed(() => {
    if (this.monto() <= 0) return false;
    if (this.mpPhase() === 'creating') return false;
    if (this.tipoPago() === 'mercado_pago' && this.emailMissing()) return false;
    if (this.whatsappBloqueaConfirmar()) return false;
    return true;
  });

  @HostListener('document:keydown.escape') onEsc(): void {
    if (this.mpPhase() !== 'creating') {
      this.close.emit();
    }
  }

  setTipo(t: TipoPago): void {
    this.tipoPago.set(t);
  }

  onNotificarWaChange(value: boolean): void {
    this.notificarPorWhatsapp.set(value);
    if (!value) {
      this.usarOtroNumeroWhatsapp.set(false);
      this.telefonoAlternativo.set('');
    }
  }

  onUsarOtroNumeroChange(value: boolean): void {
    this.usarOtroNumeroWhatsapp.set(value);
    if (!value) {
      this.telefonoAlternativo.set('');
    }
  }

  onConfirm(): void {
    if (!this.puedeConfirmar()) return;
    const tipo = this.tipoPago();
    const monto = this.monto();
    const whatsapp = this.buildWhatsappPayload();
    if (tipo === 'mercado_pago') {
      this.confirm.emit({ tipo, monto, email: this.emailToUse(), whatsapp });
      return;
    }
    this.confirm.emit({ tipo, monto, whatsapp });
  }

  private buildWhatsappPayload(): TurnoPagoWhatsappPayload | undefined {
    if (!this.notificarPorWhatsapp()) return undefined;
    return { enviar: true, telefono: this.telefonoResueltoParaEnvio() };
  }

  openCheckout(url: string): void {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  fmtMonto(n: number): string {
    return '$\u00a0' + n.toLocaleString('es-AR');
  }
}

function telefonoDefaultDesdeTurno(turno: Turno): string {
  const override = turno.telefonoNotificaciones?.trim();
  if (override) return override;
  return turno.pacienteTelefono?.trim() ?? '';
}

function contarDigitos(value: string): number {
  return (value.match(/\d/g) ?? []).length;
}
