import {

  ChangeDetectionStrategy,

  Component,

  HostListener,

  computed,

  effect,

  input,

  linkedSignal,

  output,

  signal,

} from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { Turno } from '@derma/models';

import {

  UiPhoneInputComponent,

  formatPhoneNumberByIso,

  isValidLocalPhone,

  parsePhoneNumber,

} from '@derma/ui';

import { PagoExitoPigComponent } from '../pago-exito-pig/pago-exito-pig.component';



type TipoPago = 'efectivo' | 'mercado_pago';



export type TurnoPagoMpPhase = 'idle' | 'creating' | 'ready' | 'error' | 'pagado';



export interface TurnoPagoMpCheckout {

  qr_code_base64: string | null;

  init_point: string;

  external_reference: string;

}



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

  imports: [

    CommonModule,

    FormsModule,

    UiPhoneInputComponent,

    PagoExitoPigComponent,

  ],

  templateUrl: './turno-pago-modal.component.html',

  styleUrl: './turno-pago-modal.component.css',

  changeDetection: ChangeDetectionStrategy.OnPush,

})

export class TurnoPagoModalComponent {

  turno = input.required<Turno>();

  confirm = output<TurnoPagoConfirmPayload>();

  close = output<void>();

  listo = output<void>();



  mpPhase = input<TurnoPagoMpPhase>('idle');

  mpCheckout = input<TurnoPagoMpCheckout | null>(null);

  mpError = input<string | null>(null);

  metodoPagoExito = input<TipoPago | null>(null);

  whatsappExitoOk = input<boolean | null>(null);



  tipoPago = signal<TipoPago>('efectivo');

  monto = linkedSignal(() => this.turno().monto);

  emailMp = signal('');



  notificarPorWhatsapp = signal(false);

  /** true = “Otro número”; false = ficha del turno */

  personalizarTelNotifs = signal(false);

  waCountryIso = signal('AR');

  waLocal = signal('');

  waError = signal(false);



  readonly mpBloqueado = computed(() => {

    const p = this.mpPhase();

    return p === 'creating' || p === 'ready' || p === 'pagado';

  });



  emailPagoEfectivo = computed(() => {

    const fromTurno = this.turno().pacienteEmail?.trim() ?? '';

    return fromTurno.includes('@') ? fromTurno : this.emailMp().trim();

  });



  necesitaEmailMP = computed(

    () => this.tipoPago() === 'mercado_pago' && !this.emailPagoEfectivo().includes('@'),

  );



  telefonoPacienteTurnoRaw = computed(

    () =>

      this.turno().telefonoNotificaciones?.trim() ||

      this.turno().pacienteTelefono?.trim() ||

      '',

  );



  telefonoWhatsappPacienteValido = computed(() => {

    const raw = this.telefonoPacienteTurnoRaw();

    if (!raw.trim()) return false;

    return isValidLocalPhone(parsePhoneNumber(raw).local);

  });



  telefonoNotificacionesEfectivoDisplay = computed(() => {

    const raw = this.telefonoPacienteTurnoRaw();

    if (!raw.trim()) return '';

    const { country, local } = parsePhoneNumber(raw);

    return formatPhoneNumberByIso(country.isoCode, local);

  });



  waNotifPlaceholderTurno = computed(() => {

    const raw = this.telefonoPacienteTurnoRaw();

    if (!raw.trim()) return '9 11 2345 6789';

    const { local } = parsePhoneNumber(raw);

    return local.replace(/\D/g, '').length >= 6 ? local : '9 11 2345 6789';

  });



  telefonoResueltoParaEnvio = computed(() => {

    if (!this.notificarPorWhatsapp()) return '';



    if (!this.personalizarTelNotifs()) {

      const raw = this.telefonoPacienteTurnoRaw();

      if (!raw.trim()) return '';

      const { country, local } = parsePhoneNumber(raw);

      if (!isValidLocalPhone(local)) return '';

      return formatPhoneNumberByIso(country.isoCode, local);

    }



    return isValidLocalPhone(this.waLocal())

      ? formatPhoneNumberByIso(this.waCountryIso(), this.waLocal())

      : '';

  });



  whatsappBloqueaConfirmar = computed(() => {

    if (!this.notificarPorWhatsapp()) return false;

    return !this.telefonoResueltoParaEnvio();

  });



  puedeIniciarPagoMP = computed(() => {

    if (this.monto() <= 0) return false;

    if (this.mpPhase() === 'creating') return false;

    if (!this.emailPagoEfectivo().includes('@')) return false;

    if (this.whatsappBloqueaConfirmar()) return false;

    return true;

  });



  puedeRegistrarEfectivo = computed(() => {

    if (this.monto() <= 0) return false;

    if (this.mpPhase() === 'creating') return false;

    if (this.whatsappBloqueaConfirmar()) return false;

    return true;

  });



  subtituloExito = computed(() => {

    const metodo = this.metodoPagoExito();

    const wa = this.whatsappExitoOk();

    if (metodo === 'mercado_pago') {

      if (wa === true) {

        return 'Mercado Pago acreditó el cobro y enviamos la confirmación por WhatsApp.';

      }

      if (wa === false) {

        return 'Mercado Pago acreditó el cobro. No pudimos enviar el WhatsApp.';

      }

      return 'Mercado Pago acreditó el cobro. El turno ya está confirmado en la agenda.';

    }

    if (wa === true) {

      return 'Registramos el pago en efectivo y enviamos la confirmación por WhatsApp.';

    }

    if (wa === false) {

      return 'Registramos el pago en efectivo. No pudimos enviar el WhatsApp.';

    }

    return 'Registramos el pago en efectivo. El turno ya está confirmado en la agenda.';

  });



  constructor() {

    effect(() => {

      void this.turno();

      const tel = this.telefonoPacienteTurnoRaw();

      const { country, local } = parsePhoneNumber(tel);



      this.waCountryIso.set(country.isoCode);

      this.waLocal.set(local);

      this.waError.set(false);

      this.notificarPorWhatsapp.set(!!tel.trim());

      this.personalizarTelNotifs.set(!(!!tel.trim() && isValidLocalPhone(local)));

    });

  }



  @HostListener('document:keydown.escape')

  onEsc(): void {

    if (this.mpPhase() !== 'creating') {

      this.close.emit();

    }

  }



  setTipo(t: TipoPago): void {

    if (this.mpBloqueado()) return;

    this.tipoPago.set(t);

  }



  onNotificarWaChange(value: boolean): void {

    this.notificarPorWhatsapp.set(value);

    if (!value) {

      this.waError.set(false);

    }

  }



  onWaInputChange(): void {

    if (this.telefonoResueltoParaEnvio() || !this.notificarPorWhatsapp()) {

      this.waError.set(false);

    }

  }



  onPersonalizarTelPago(custom: boolean): void {



    if (!custom) {

      const raw = this.telefonoPacienteTurnoRaw();

      const { country, local } = parsePhoneNumber(raw);

      if (!raw.trim() || !isValidLocalPhone(local)) {

        return;

      }

      this.waCountryIso.set(country.isoCode);

      this.waLocal.set(local);

    }

    this.personalizarTelNotifs.set(custom);

    this.onWaInputChange();

  }



  onConfirmEfectivo(): void {

    if (!this.puedeRegistrarEfectivo()) {

      if (this.whatsappBloqueaConfirmar()) this.waError.set(true);

      return;

    }

    this.confirm.emit(this.buildPayload('efectivo'));

  }



  onConfirmMp(): void {

    if (!this.puedeIniciarPagoMP()) {

      if (this.whatsappBloqueaConfirmar()) this.waError.set(true);

      return;

    }

    this.confirm.emit(this.buildPayload('mercado_pago'));

  }



  private buildPayload(tipo: TipoPago): TurnoPagoConfirmPayload {

    const monto = this.monto();

    const whatsapp = this.buildWhatsappPayload();

    if (tipo === 'mercado_pago') {

      return { tipo, monto, email: this.emailPagoEfectivo(), whatsapp };

    }

    return { tipo, monto, whatsapp };

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

    return '$ ' + n.toLocaleString('es-AR');

  }



  fmtFechaTurno(): string {

    const d = this.turno().fecha.toDate();

    return d.toLocaleDateString('es-AR', {

      weekday: 'long',

      day: 'numeric',

      month: 'long',

      timeZone: 'America/Argentina/Buenos_Aires',

    });

  }

}

