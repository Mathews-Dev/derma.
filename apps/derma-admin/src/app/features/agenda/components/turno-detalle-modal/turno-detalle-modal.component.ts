import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap, firstValueFrom, from } from 'rxjs';
import { Turno, AccionTurno, EstadoTurno, EstadoPago, Profesional, Usuario } from '@derma/models';
import { TurnosService, FirestoreService } from '@derma/firebase';
import { STATUS, PAGO_STATUS, ToastService } from '@derma/ui';
import { GoogleCalendarApiService } from '../../../videoconsulta/data-access/google-calendar-api.service';
import { buildCrearEventoPayload } from '../../../videoconsulta/utils/videoconsulta-calendar.utils';
import {
  buildRecordatorioEtiqueta,
  esVideoconsultaTurno,
  linkEstadoFromTurno,
} from '../../../videoconsulta/utils/videoconsulta-turno.utils';
import { VideoconsultaMeetPanelComponent } from '../../../videoconsulta/components/videoconsulta-meet-panel/videoconsulta-meet-panel.component';

interface DetalleAccionUi {
  accion: AccionTurno;
  label: string;
  icon: string;
  variant: 'primary' | 'ghost' | 'danger' | 'success';
}

@Component({
  selector: 'derm-turno-detalle-modal',
  standalone: true,
  imports: [CommonModule, RouterLink, VideoconsultaMeetPanelComponent],
  templateUrl: './turno-detalle-modal.component.html',
  styleUrl: './turno-detalle-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TurnoDetalleModalComponent {
  private readonly turnosService = inject(TurnosService);
  private readonly firestoreService = inject(FirestoreService);
  private readonly googleCalendarApi = inject(GoogleCalendarApiService);
  private readonly toast = inject(ToastService);

  turno = input.required<Turno>();

  accion = output<{ accion: AccionTurno; turno: Turno }>();
  close = output<void>();

  readonly generandoMeet = signal(false);

  /** Turno en vivo desde Firestore (Meet / recordatorio actualizados). */
  private readonly turnoLive = toSignal(
    toObservable(computed(() => this.turno().id)).pipe(
      switchMap(id => this.turnosService.watchById(id)),
    ),
    { initialValue: undefined },
  );

  readonly t = computed(() => this.turnoLive() ?? this.turno());

  readonly esVc = computed(() => esVideoconsultaTurno(this.t()));

  readonly linkMeet = computed(() => this.t().videoconsulta?.linkMeet?.trim() ?? '');

  readonly linkEstado = computed(() => linkEstadoFromTurno(this.t()));

  readonly recordatorioEtiqueta = computed(() => buildRecordatorioEtiqueta(this.t()));

  readonly calendarBaseOk = computed(() => this.googleCalendarApi.tieneBaseUrlConfigurada());

  private readonly profDoc = toSignal(
    toObservable(computed(() => this.t().profesionalId)).pipe(
      switchMap(uid => from(this.firestoreService.getDocument<Usuario>('usuarios', uid))),
    ),
    { initialValue: undefined as Usuario | undefined },
  );

  readonly googleConectado = computed(
    () => (this.profDoc() as Profesional | undefined)?.googleCalendar?.conectado === true,
  );

  readonly AccionTurno = AccionTurno;
  readonly EstadoTurno = EstadoTurno;
  readonly EstadoPago = EstadoPago;

  @HostListener('document:keydown.escape')
  onEsc() { this.close.emit(); }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close.emit();
    }
  }

  emitAccion(accion: AccionTurno) {
    this.accion.emit({ accion, turno: this.t() });
  }

  async copiarLinkMeet(): Promise<void> {
    const url = this.linkMeet();
    if (!url) {
      this.toast.warning('Todavía no hay enlace de reunión');
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      this.toast.success('Enlace copiado');
    } catch {
      this.toast.error('No se pudo copiar');
    }
  }

  abrirMeet(): void {
    const url = this.linkMeet();
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async generarMeet(enviarWhatsapp: boolean): Promise<void> {
    if (!this.calendarBaseOk()) {
      this.toast.warning('Falta configurar el backend de Google Calendar');
      return;
    }
    this.generandoMeet.set(true);
    try {
      const payload = buildCrearEventoPayload(this.t(), { enviarWhatsapp });
      const res = await firstValueFrom(this.googleCalendarApi.crearEvento(payload));
      if (res.whatsapp?.enviado) {
        this.toast.success('Meet creado y aviso enviado por WhatsApp');
      } else {
        this.toast.success('Evento de videoconsulta creado');
      }
    } catch (e) {
      this.toast.error(mensajeErrorHttp(e));
    } finally {
      this.generandoMeet.set(false);
    }
  }

  conectarGoogleProfesional(): void {
    if (!this.calendarBaseOk()) return;
    window.location.href = this.googleCalendarApi.urlConectarGoogle(this.t().profesionalId);
  }

  get footerGroups(): {
    primary: DetalleAccionUi[];
    success: DetalleAccionUi[];
    ghost: DetalleAccionUi[];
    danger: DetalleAccionUi[];
  } {
    const all = this.buildAcciones();
    return {
      primary: all.filter((a) => a.variant === 'primary'),
      success: all.filter((a) => a.variant === 'success'),
      ghost: all.filter((a) => a.variant === 'ghost'),
      danger: all.filter((a) => a.variant === 'danger'),
    };
  }

  private buildAcciones(): DetalleAccionUi[] {
    const estado = this.t().estado;
    const actions: DetalleAccionUi[] = [];

    if (estado === EstadoTurno.PENDIENTE) {
      actions.push({ accion: AccionTurno.CONFIRMAR, label: 'Confirmar turno', icon: 'check', variant: 'primary' });
    }
    if (estado === EstadoTurno.CONFIRMADO) {
      const label = this.esVc() ? 'Finalizar videoconsulta' : 'Marcar atendido';
      actions.push({ accion: AccionTurno.ATENDER, label, icon: 'heart', variant: 'primary' });
      actions.push({ accion: AccionTurno.MARCAR_NO_ASISTIO, label: 'No asistió', icon: 'x-circle', variant: 'ghost' });
    }
    if (
      estado !== EstadoTurno.CANCELADO &&
      estado !== EstadoTurno.ATENDIDO &&
      estado !== EstadoTurno.NO_ASISTIO
    ) {
      actions.push({ accion: AccionTurno.REPROGRAMAR, label: 'Reprogramar', icon: 'calendar', variant: 'ghost' });
      actions.push({ accion: AccionTurno.CANCELAR, label: 'Cancelar turno', icon: 'trash', variant: 'danger' });
    }
    if (this.turnoMayRegistrarPago()) {
      actions.push({ accion: AccionTurno.REGISTRAR_PAGO, label: 'Registrar pago', icon: 'credit-card', variant: 'success' });
    }

    return actions;
  }

  private turnoMayRegistrarPago(): boolean {
    if (this.t().estadoPago === EstadoPago.PAGADO) return false;
    const e = this.t().estado;
    return e === EstadoTurno.PENDIENTE || e === EstadoTurno.CONFIRMADO;
  }

  getEstadoLabel(): string {
    return STATUS[this.t().estado]?.label ?? this.t().estado;
  }

  getEstadoColor(): string {
    return STATUS[this.t().estado]?.color ?? 'var(--c-600)';
  }

  getEstadoBg(): string {
    return STATUS[this.t().estado]?.bg ?? 'var(--c-100)';
  }

  getPagoLabel(): string {
    return PAGO_STATUS[this.t().estadoPago]?.label ?? this.t().estadoPago;
  }

  getPagoColor(): string {
    return PAGO_STATUS[this.t().estadoPago]?.color ?? 'var(--c-600)';
  }

  getPagoBg(): string {
    return PAGO_STATUS[this.t().estadoPago]?.bg ?? 'var(--c-100)';
  }

  fmtFecha(ts: { toDate?: () => Date } | Date | null | undefined): string {
    if (!ts) return '—';
    const d = typeof (ts as { toDate?: () => Date }).toDate === 'function'
      ? (ts as { toDate: () => Date }).toDate()
      : new Date(ts as Date);
    return d.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  fmtMonto(n: number): string {
    return '$\u00a0' + n.toLocaleString('es-AR');
  }
}

function mensajeErrorHttp(e: unknown): string {
  if (e instanceof HttpErrorResponse) {
    const body = e.error as { error?: string; message?: string } | null;
    if (body && typeof body.error === 'string') return body.error;
    if (body && typeof body.message === 'string') return body.message;
    return e.message;
  }
  return 'No se pudo crear el evento';
}
