import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map, switchMap, of, firstValueFrom } from 'rxjs';
import { UiBadgeComponent, CheckboxComponent, ToastService } from '@derma/ui';
import type { VideoconsultaDetalle } from '../../models/videoconsulta.view-model';
import { VideoconsultaService } from '../../data-access/videoconsulta.service';
import { GoogleCalendarApiService } from '../../data-access/google-calendar-api.service';
import { buildCrearEventoPayload } from '../../utils/videoconsulta-calendar.utils';
import { VideoconsultaMeetPanelComponent } from '../../components/videoconsulta-meet-panel/videoconsulta-meet-panel.component';
import { VideoconsultaTimelineComponent } from '../../components/videoconsulta-timeline/videoconsulta-timeline.component';

@Component({
  selector: 'derm-videoconsulta-detalle',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    UiBadgeComponent,
    CheckboxComponent,
    VideoconsultaMeetPanelComponent,
    VideoconsultaTimelineComponent,
  ],
  templateUrl: './videoconsulta-detalle.component.html',
  styleUrl: './videoconsulta-detalle.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoconsultaDetalleComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly videoconsultaService = inject(VideoconsultaService);
  private readonly googleCalendarApi = inject(GoogleCalendarApiService);

  readonly turnoRouteId = toSignal(
    this.route.paramMap.pipe(map(p => p.get('id') ?? '')),
    { initialValue: this.route.snapshot.paramMap.get('id') ?? '' },
  );

  private readonly bundle = toSignal(
    toObservable(this.turnoRouteId).pipe(
      switchMap(id => (id ? this.videoconsultaService.watchTurnoYDetalle$(id) : of(undefined))),
    ),
    { initialValue: undefined },
  );

  readonly item = computed(() => this.bundle()?.detalle);

  private readonly turnoActual = computed(() => this.bundle()?.turno);

  readonly generandoMeet = signal(false);

  readonly calendarBaseOk = computed(() => this.googleCalendarApi.tieneBaseUrlConfigurada());

  readonly otroNumPaciente = signal(false);
  readonly otroNumProfesional = signal(false);

  volver(): void {
    void this.router.navigate(['/admin/videoconsultas']);
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

  async generarMeet(): Promise<void> {
    if (!this.calendarBaseOk()) {
      this.toast.warning('Configurá googleCalendarApiUrl en el entorno');
      return;
    }
    const turno = this.turnoActual();
    if (!turno) return;
    this.generandoMeet.set(true);
    try {
      const payload = buildCrearEventoPayload(turno);
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
