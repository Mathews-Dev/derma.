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
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, switchMap, of, firstValueFrom } from 'rxjs';
import { UiBadgeComponent, ToastService } from '@derma/ui';
import { TurnosService } from '@derma/firebase';
import { EstadoTurno, Profesional, Turno, Usuario } from '@derma/models';
import { VideoconsultaService } from '../../data-access/videoconsulta.service';
import { GoogleCalendarApiService } from '../../data-access/google-calendar-api.service';
import { buildCrearEventoPayload } from '../../utils/videoconsulta-calendar.utils';
import { googleEventIdFromTurno } from '../../utils/videoconsulta-turno.utils';
import { mapTurnoToDetalle } from '../../utils/videoconsulta-mapper';
import { VideoconsultaMeetPanelComponent } from '../../components/videoconsulta-meet-panel/videoconsulta-meet-panel.component';
import { VideoconsultaTimelineComponent } from '../../components/videoconsulta-timeline/videoconsulta-timeline.component';
import {
  TurnoAtenderModalComponent,
  type TurnoAtenderConfirmPayload,
} from '../../../agenda/components/turno-atender-modal/turno-atender-modal.component';
import { TurnoCancelarModalComponent } from '../../../agenda/components/turno-cancelar-modal/turno-cancelar-modal.component';
import {
  formatFechaPlantillaWhatsapp,
  WhatsappNotificacionesService,
} from '../../../agenda/data-access/whatsapp-notificaciones.service';

@Component({
  selector: 'derm-videoconsulta-detalle',
  standalone: true,
  imports: [
    CommonModule,
    UiBadgeComponent,
    VideoconsultaMeetPanelComponent,
    VideoconsultaTimelineComponent,
    TurnoAtenderModalComponent,
    TurnoCancelarModalComponent,
  ],
  templateUrl: './videoconsulta-detalle.component.html',
  styleUrl: './videoconsulta-detalle.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoconsultaDetalleComponent {
  private readonly toast = inject(ToastService);
  private readonly videoconsultaService = inject(VideoconsultaService);
  private readonly googleCalendarApi = inject(GoogleCalendarApiService);
  private readonly turnosService = inject(TurnosService);
  private readonly whatsappNotificaciones = inject(WhatsappNotificacionesService);

  /** Turno ya cargado en el listado (render instantáneo, como agenda). */
  turnoInicial = input<Turno | null>(null);
  turnoId = input.required<string>();
  close = output<void>();

  /** Actualizaciones en vivo del documento turno. */
  private readonly turnoLive = toSignal(
    toObservable(computed(() => this.turnoId())).pipe(
      switchMap(id => (id ? this.turnosService.watchById(id) : of(undefined))),
    ),
    { initialValue: undefined as Turno | undefined },
  );

  readonly turnoActual = computed(
    () => this.turnoLive() ?? this.turnoInicial() ?? undefined,
  );

  private readonly prof = toSignal(
    toObservable(computed(() => this.turnoActual()?.profesionalId ?? '')).pipe(
      distinctUntilChanged(),
      switchMap(uid => (uid ? this.videoconsultaService.getProfesionalCached$(uid) : of(null))),
    ),
    { initialValue: null as Usuario | null },
  );

  readonly item = computed(() => {
    const t = this.turnoActual();
    if (!t) return undefined;
    return mapTurnoToDetalle(t, this.prof() ?? undefined);
  });

  readonly googleConectado = computed(() => {
    const prof = this.prof();
    if (prof && 'googleCalendar' in prof) {
      return (prof as Profesional).googleCalendar?.conectado === true;
    }
    return false;
  });

  readonly generandoMeet = signal(false);
  readonly modalAtender = signal(false);
  readonly modalCancelar = signal(false);
  readonly atendiendo = signal(false);
  readonly cancelando = signal(false);

  readonly calendarBaseOk = computed(() => this.googleCalendarApi.tieneBaseUrlConfigurada());

  readonly puedeFinalizar = computed(() => {
    const t = this.turnoActual();
    return t?.estado === EstadoTurno.CONFIRMADO;
  });

  readonly puedeCancelar = computed(() => {
    const e = this.turnoActual()?.estado;
    return (
      e === EstadoTurno.PENDIENTE ||
      e === EstadoTurno.CONFIRMADO ||
      e === EstadoTurno.REPROGRAMADO
    );
  });

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.modalAtender() || this.modalCancelar()) return;
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close.emit();
    }
  }

  abrirFinalizar(): void {
    if (!this.puedeFinalizar()) return;
    this.modalAtender.set(true);
  }

  abrirCancelar(): void {
    if (!this.puedeCancelar()) return;
    this.modalCancelar.set(true);
  }

  async onAtenderConfirm(payload: TurnoAtenderConfirmPayload): Promise<void> {
    const t = this.turnoActual();
    if (!t) return;
    this.atendiendo.set(true);
    try {
      await this.turnosService.marcarAtendido(t.id, payload.notasProfesional);
      this.toast.success('Videoconsulta finalizada');
      this.modalAtender.set(false);
    } catch {
      this.toast.error('No se pudo finalizar la videoconsulta');
    } finally {
      this.atendiendo.set(false);
    }
  }

  onAtenderClose(): void {
    if (this.atendiendo()) return;
    this.modalAtender.set(false);
  }

  async onCancelarConfirm(e: { motivo: string }): Promise<void> {
    const t = this.turnoActual();
    if (!t) return;
    this.cancelando.set(true);
    try {
      await this.turnosService.cancelar(t.id, e.motivo);
      await this.cancelarEventoGoogleSiCorresponde(t);
      const telefono = t.telefonoNotificaciones?.trim() || t.pacienteTelefono?.trim();
      if (telefono) {
        try {
          await this.whatsappNotificaciones.enviarCancelacionTurno({
            telefono,
            pacienteNombre: t.pacienteNombre,
            fecha: formatFechaPlantillaWhatsapp(t.fecha.toDate()),
            horaInicio: t.horaInicio,
            accessToken: await this.accessTokenParaWhatsapp(t),
          });
          this.toast.success('Turno cancelado y WhatsApp enviado');
        } catch {
          this.toast.warning('Turno cancelado; no se pudo enviar el WhatsApp');
        }
      } else {
        this.toast.success('Turno cancelado');
      }
      this.modalCancelar.set(false);
      this.close.emit();
    } catch {
      this.toast.error('Error al cancelar el turno');
    } finally {
      this.cancelando.set(false);
    }
  }

  onCancelarClose(): void {
    if (this.cancelando()) return;
    this.modalCancelar.set(false);
  }

  async copiarLink(): Promise<void> {
    const url = this.item()?.linkMeet ?? '';
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
    const url = this.item()?.linkMeet ?? '';
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async generarMeet(enviarWhatsapp: boolean): Promise<void> {
    if (!this.calendarBaseOk()) {
      this.toast.warning('Configurá googleCalendarApiUrl en el entorno');
      return;
    }
    const turno = this.turnoActual();
    if (!turno) return;
    this.generandoMeet.set(true);
    try {
      const payload = buildCrearEventoPayload(turno, { enviarWhatsapp });
      const res = await firstValueFrom(this.googleCalendarApi.crearEvento(payload));
      if (res.whatsapp?.enviado) {
        this.toast.success('Evento creado y aviso enviado por WhatsApp');
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
    const uid = this.item()?.profesionalUid;
    if (!uid) return;
    if (!this.calendarBaseOk()) {
      this.toast.warning('Configurá googleCalendarApiUrl en el entorno');
      return;
    }
    window.location.href = this.googleCalendarApi.urlConectarGoogle(uid);
  }

  private async accessTokenParaWhatsapp(turno: Turno): Promise<string> {
    if (turno.accessToken) return turno.accessToken;
    return this.turnosService.ensureAccessToken(turno.id);
  }

  private async cancelarEventoGoogleSiCorresponde(turno: Turno): Promise<void> {
    const eventId = googleEventIdFromTurno(turno);
    if (!eventId || !this.calendarBaseOk()) return;
    try {
      await firstValueFrom(
        this.googleCalendarApi.cancelarEvento(turno.profesionalId, eventId),
      );
    } catch (err) {
      console.warn('[Videoconsulta] No se pudo cancelar evento en Google Calendar', err);
    }
  }
}

function mensajeErrorHttp(e: unknown): string {
  if (e instanceof HttpErrorResponse) {
    const body = e.error as { error?: string } | null;
    if (body && typeof body.error === 'string') {
      return body.error;
    }
    return e.message;
  }
  return 'No se pudo crear el evento';
}
