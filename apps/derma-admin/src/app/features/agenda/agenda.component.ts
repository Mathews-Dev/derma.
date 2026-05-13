import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap, map, startWith, Subscription, timer, firstValueFrom } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { Timestamp } from 'firebase/firestore';
import {
  AgendaSidebarComponent,
  CalendarGridComponent,
  AgendaListComponent,
  AgendaFilters,
  defaultAgendaFilters,
  UiPageHeaderComponent,
  UiButtonComponent,
  ProfesionalSidebar,
} from '@derma/ui';
import { TurnosService, FirestoreService } from '@derma/firebase';
import {
  Turno,
  AccionTurno,
  Profesional,
  RolUsuario,
  EstadoTurno,
  EstadoPago,
} from '@derma/models';
import { toObservable } from '@angular/core/rxjs-interop';
import { TurnoDetalleModalComponent } from './components/turno-detalle-modal/turno-detalle-modal.component';
import { TurnoCancelarModalComponent } from './components/turno-cancelar-modal/turno-cancelar-modal.component';
import { TurnoReprogramarModalComponent } from './components/turno-reprogramar-modal/turno-reprogramar-modal.component';
import {
  TurnoPagoModalComponent,
  TurnoPagoMpCheckout,
  TurnoPagoMpPhase,
  type TurnoPagoConfirmPayload,
} from './components/turno-pago-modal/turno-pago-modal.component';
import { TurnoNuevoModalComponent } from './components/turno-nuevo-modal/turno-nuevo-modal.component';
import type { TurnoNuevoPayload } from './components/turno-nuevo-modal/turno-nuevo-modal.component';
import { ToastService } from '@derma/ui';
import { MercadoPagoPaymentService, createIdempotencyKey } from '@derma/mercadopago';
import {
  formatFechaPlantillaWhatsapp,
  WhatsappNotificacionesService,
} from './data-access/whatsapp-notificaciones.service';
import { turnoDentroDeDisponibilidadProfesional } from './disponibilidad/disponibilidad-agenda.utils';

/** ID de clínica hardcodeado por ahora. En el futuro vendrá de AuthService/contexto. */
const CLINICA_ID = 'clinica_default';

@Component({
  selector: 'derm-agenda',
  standalone: true,
  imports: [
    CommonModule,
    AgendaSidebarComponent,
    CalendarGridComponent,
    AgendaListComponent,
    UiPageHeaderComponent,
    UiButtonComponent,
    TurnoDetalleModalComponent,
    TurnoCancelarModalComponent,
    TurnoReprogramarModalComponent,
    TurnoPagoModalComponent,
    TurnoNuevoModalComponent,
  ],
  templateUrl: './agenda.component.html',
  styleUrl: './agenda.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgendaComponent {
  private readonly turnosService = inject(TurnosService);
  private readonly firestoreService = inject(FirestoreService);
  private readonly toast = inject(ToastService);
  private readonly mpPayment = inject(MercadoPagoPaymentService);
  private readonly whatsappNotificaciones = inject(WhatsappNotificacionesService);

  private mpPollSub: Subscription | undefined;
  /** Si el cobro MP se aprueba, enviamos la plantilla de confirmación a este número. */
  private readonly pagoWhatsappPendienteMp = signal<{ telefono: string } | null>(null);

  // ─── UI State ─────────────────────────────────────────────────────────────
  selectedDate = signal(new Date());
  viewMode = signal<'day' | 'week'>('day');
  filters = signal<AgendaFilters>(defaultAgendaFilters());
  search = signal('');
  sidebarCollapsed = signal(false);
  rightPanelCollapsed = signal(false);

  // ─── Modal State ──────────────────────────────────────────────────────────
  turnoSeleccionado = signal<Turno | null>(null);
  modalDetalle = signal(false);
  modalCancelar = signal(false);
  modalReprogramar = signal(false);
  modalPago = signal(false);
  modalNuevo = signal(false);

  pagoMpPhase = signal<TurnoPagoMpPhase>('idle');
  pagoMpCheckout = signal<TurnoPagoMpCheckout | null>(null);
  pagoMpError = signal<string | null>(null);

  // ─── Profesionales (para el sidebar) ─────────────────────────────────────
  profesionales$ = this.firestoreService.getCollectionByFilter<Profesional>(
    'usuarios',
    'rol',
    RolUsuario.DERMATOLOGO,
  );

  profesionalesSidebar = toSignal(
    this.profesionales$.pipe(
      map(profs =>
        profs.map(
          p =>
            ({
              id: p.uid,
              nombre: p.nombre,
              apellido: p.apellido,
            }) as ProfesionalSidebar,
        ),
      ),
      startWith([] as ProfesionalSidebar[]),
    ),
  );

  profesionales = toSignal(this.profesionales$.pipe(startWith([] as Profesional[])));

  // ─── Rango de fechas según la vista ──────────────────────────────────────
  private dateRange = computed(() => {
    const d = this.selectedDate();
    if (this.viewMode() === 'day') {
      return { desde: d, hasta: d };
    }
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const lunes = new Date(d);
    lunes.setDate(diff);
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    return { desde: lunes, hasta: domingo };
  });

  // ─── Stream de turnos reales desde Firestore ──────────────────────────────
  private turns$ = toObservable(this.dateRange).pipe(
    switchMap(({ desde, hasta }) => this.turnosService.getTurnosByRango(desde, hasta, CLINICA_ID)),
  );

  allTurns = toSignal(this.turns$.pipe(startWith([] as Turno[])));

  // ─── Filtrado reactivo en memoria ─────────────────────────────────────────
  filteredTurns = computed(() => {
    const f = this.filters();
    const q = this.search().toLowerCase().trim();
    const turns = this.allTurns() ?? [];

    return turns.filter((t: Turno) => {
      if (f.profesionalesIds.length > 0 && !f.profesionalesIds.includes(t.profesionalId))
        return false;
      if (f.status !== 'todos' && t.estado !== f.status) return false;
      if (f.type !== 'todos' && t.tipo !== f.type) return false;
      if (q) {
        const hayMatch =
          t.pacienteNombre.toLowerCase().includes(q) ||
          (t.pacienteDNI?.includes(q) ?? false) ||
          (t.pacienteTelefono?.includes(q) ?? false);
        if (!hayMatch) return false;
      }
      return true;
    });
  });

  /** Turnos del día seleccionado para el panel derecho (lista). */
  dayTurns = computed(() => {
    const fecha = this.selectedDate();
    const turns = this.filteredTurns() ?? [];
    return turns
      .filter((t: Turno) => {
        const td = t.fecha.toDate();
        return (
          td.getFullYear() === fecha.getFullYear() &&
          td.getMonth() === fecha.getMonth() &&
          td.getDate() === fecha.getDate()
        );
      })
      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  });

  // ─── Handlers de navegación/vista ─────────────────────────────────────────

  onDateSelect(dateStr: string) {
    this.selectedDate.set(new Date(dateStr + 'T12:00:00'));
  }

  onFilterChange(f: AgendaFilters) {
    this.filters.set({
      profesionalesIds: [...f.profesionalesIds],
      status: f.status,
      type: f.type,
    });
  }

  onSearchChange(q: string) {
    this.search.set(q);
  }

  onViewChange(m: 'day' | 'week') {
    this.viewMode.set(m);
  }

  toggleSidebar() {
    this.sidebarCollapsed.update(v => !v);
  }

  toggleRightPanel() {
    this.rightPanelCollapsed.update(v => !v);
  }

  // ─── Handlers de turnos ────────────────────────────────────────────────────

  /** Abre el modal de detalle del turno. */
  onTurnoClick(id: string) {
    const turno = (this.allTurns() ?? []).find(t => t.id === id);
    if (turno) {
      this.turnoSeleccionado.set(turno);
      this.modalDetalle.set(true);
    }
  }

  /** Drag & Drop: reprograma el horario del turno. */
  async onTurnoMoved(e: { id: string; newStart: string; newEnd: string }) {
    const turno = (this.allTurns() ?? []).find(t => t.id === e.id);
    if (!turno) return;
    const day = turno.fecha.toDate();
    const prof = (this.profesionales() ?? []).find(p => p.uid === turno.profesionalId);
    const disp = turnoDentroDeDisponibilidadProfesional(prof, day, e.newStart, e.newEnd);
    if (!disp.ok) {
      this.toast.show(disp.mensaje, 'error');
      return;
    }
    if (this.turnoSolapa(turno.profesionalId, day, e.newStart, e.newEnd, turno.id)) {
      this.toast.show('Ese horario ya está ocupado para el profesional', 'error');
      return;
    }
    try {
      await this.turnosService.update(e.id, {
        horaInicio: e.newStart,
        horaFin: e.newEnd,
      });
      this.toast.show('Turno reprogramado', 'success');
    } catch {
      this.toast.show('Error al mover el turno', 'error');
    }
  }

  /** Quick actions desde la lista del panel derecho. */
  async onQuickAction(e: { id: string; accion: AccionTurno }) {
    const turno = (this.allTurns() ?? []).find(t => t.id === e.id);
    if (!turno) return;

    try {
      switch (e.accion) {
        case AccionTurno.CONFIRMAR:
          await this.turnosService.confirmar(e.id);
          this.toast.show('Turno confirmado', 'success');
          break;

        case AccionTurno.ATENDER:
          await this.turnosService.marcarAtendido(e.id);
          this.toast.show('Turno marcado como atendido', 'success');
          break;

        case AccionTurno.CANCELAR:
          this.turnoSeleccionado.set(turno);
          this.modalCancelar.set(true);
          break;

        case AccionTurno.REGISTRAR_PAGO:
          this.pagoMpPhase.set('idle');
          this.pagoMpCheckout.set(null);
          this.pagoMpError.set(null);
          this.turnoSeleccionado.set(turno);
          this.modalPago.set(true);
          break;

        case AccionTurno.REPROGRAMAR:
          this.turnoSeleccionado.set(turno);
          this.modalReprogramar.set(true);
          break;

        case AccionTurno.MARCAR_NO_ASISTIO:
          await this.turnosService.marcarNoAsistio(e.id);
          this.toast.show('Turno marcado como no asistió', 'success');
          break;
      }
    } catch {
      this.toast.show('Error al ejecutar la acción', 'error');
    }
  }

  onNewTurn() {
    this.modalNuevo.set(true);
  }

  // ─── Callbacks de modales ─────────────────────────────────────────────────

  /** Modal de detalle: despacha una acción seleccionada dentro del detalle. */
  onDetalleAccion(e: { accion: AccionTurno; turno: Turno }) {
    this.modalDetalle.set(false);
    this.onQuickAction({ id: e.turno.id, accion: e.accion });
  }

  onDetalleClose() {
    this.modalDetalle.set(false);
    this.turnoSeleccionado.set(null);
  }

  async onCancelarConfirm(e: { motivo: string; conReembolso: boolean }) {
    const t = this.turnoSeleccionado();
    if (!t) return;
    try {
      await this.turnosService.cancelar(t.id, e.motivo, e.conReembolso);
      this.toast.show('Turno cancelado', 'success');
    } catch {
      this.toast.show('Error al cancelar el turno', 'error');
    } finally {
      this.modalCancelar.set(false);
      this.turnoSeleccionado.set(null);
    }
  }

  onCancelarClose() {
    this.modalCancelar.set(false);
  }

  async onReprogramarConfirm(e: {
    nuevaFecha: Date;
    horaInicio: string;
    horaFin: string;
    motivo: string;
  }) {
    const t = this.turnoSeleccionado();
    if (!t) return;
    const prof = (this.profesionales() ?? []).find(p => p.uid === t.profesionalId);
    const disp = turnoDentroDeDisponibilidadProfesional(prof, e.nuevaFecha, e.horaInicio, e.horaFin);
    if (!disp.ok) {
      this.toast.show(disp.mensaje, 'error');
      return;
    }
    if (this.turnoSolapa(t.profesionalId, e.nuevaFecha, e.horaInicio, e.horaFin, t.id)) {
      this.toast.show('Ese horario ya está ocupado para el profesional elegido', 'error');
      return;
    }
    try {
      const nuevoId = await this.turnosService.reprogramar(
        t,
        Timestamp.fromDate(e.nuevaFecha),
        e.horaInicio,
        e.horaFin,
        e.motivo,
      );
      this.toast.show(`Turno reprogramado (nuevo ID: ${nuevoId})`, 'success');
    } catch {
      this.toast.show('Error al reprogramar el turno', 'error');
    } finally {
      this.modalReprogramar.set(false);
      this.turnoSeleccionado.set(null);
    }
  }

  onReprogramarClose() {
    this.modalReprogramar.set(false);
  }

  async onPagoConfirm(e: TurnoPagoConfirmPayload) {
    const t = this.turnoSeleccionado();
    if (!t) return;

    if (e.tipo === 'efectivo') {
      try {
        await this.turnosService.registrarPagoEfectivo(t.id, e.monto);
        if (e.whatsapp?.enviar && e.whatsapp.telefono) {
          try {
            await this.persistTelefonoWhatsapp(t.id, e.whatsapp.telefono);
            await this.enviarConfirmacionWhatsapp(t, e.whatsapp.telefono);
            this.toast.show('Pago en efectivo registrado y WhatsApp enviado', 'success');
          } catch {
            this.toast.show('Pago registrado; no se pudo enviar el WhatsApp', 'warning');
          }
        } else {
          this.toast.show('Pago en efectivo registrado', 'success');
        }
      } catch {
        this.toast.show('Error al registrar el pago', 'error');
      } finally {
        this.closePagoModal();
      }
      return;
    }

    const email = (e.email?.trim() || t.pacienteEmail?.trim() || '').trim();
    if (!email.includes('@')) {
      this.toast.show('Ingresá un email válido para cobrar con Mercado Pago', 'error');
      return;
    }

    this.pagoWhatsappPendienteMp.set(null);
    if (e.whatsapp?.enviar && e.whatsapp.telefono) {
      try {
        await this.persistTelefonoWhatsapp(t.id, e.whatsapp.telefono);
        this.pagoWhatsappPendienteMp.set({ telefono: e.whatsapp.telefono });
      } catch {
        this.toast.show('No se pudo guardar el teléfono para WhatsApp', 'error');
        return;
      }
    }

    if (e.monto !== t.monto) {
      try {
        await this.turnosService.update(t.id, { monto: e.monto });
      } catch {
        this.toast.show('No se pudo actualizar el monto del turno', 'error');
        return;
      }
    }
    if (email !== (t.pacienteEmail?.trim() ?? '')) {
      try {
        await this.turnosService.update(t.id, { pacienteEmail: email });
      } catch {
        this.toast.show('No se pudo guardar el email para Mercado Pago', 'error');
        return;
      }
    }

    this.pagoMpPhase.set('creating');
    this.pagoMpError.set(null);

    const key = createIdempotencyKey();
    try {
      const resp = await firstValueFrom(
        this.mpPayment.crearPreferencia(
          {
            turnoId: t.id,
            precio: e.monto,
            email,
            nombre: t.pacienteNombre.trim() || 'Paciente',
          },
          key,
        ),
      );

      if (!resp.success || !resp.external_reference) {
        const msg = resp.error ?? 'No se pudo crear la preferencia';
        throw new Error(msg);
      }

      this.pagoMpCheckout.set({
        qr_code_base64: resp.qr_code_base64 ?? null,
        init_point: resp.init_point ?? '',
        external_reference: resp.external_reference,
      });
      this.pagoMpPhase.set('ready');
      // Evita que quede `metodoPago: null` cuando el flujo es MP.
      void this.turnosService.registrarPagoMP(t.id, { mpStatus: 'pending' });
      this.startMpPolling(resp.external_reference);
    } catch (err: unknown) {
      this.pagoWhatsappPendienteMp.set(null);
      this.pagoMpPhase.set('error');
      const msg = parseMpHttpError(err);
      this.pagoMpError.set(msg);
      this.toast.show(msg, 'error');
    }
  }

  onPagoClose() {
    this.closePagoModal();
  }

  onNuevoClose() {
    this.modalNuevo.set(false);
  }

  async onNuevoConfirm(payload: TurnoNuevoPayload) {
    const day = this.selectedDate();
    const prof = (this.profesionales() ?? []).find(p => p.uid === payload.profesionalId);
    const disp = turnoDentroDeDisponibilidadProfesional(prof, day, payload.horaInicio, payload.horaFin);
    if (!disp.ok) {
      this.toast.show(disp.mensaje, 'error');
      return;
    }
    if (this.turnoSolapa(payload.profesionalId, day, payload.horaInicio, payload.horaFin)) {
      this.toast.show('Ese horario ya está ocupado para el profesional elegido', 'error');
      return;
    }

    const pacienteId = payload.pacienteId;
    const fecha = Timestamp.fromDate(new Date(day.getFullYear(), day.getMonth(), day.getDate()));

    try {
      await this.turnosService.create({
        clinicaId: CLINICA_ID,
        pacienteId,
        profesionalId: payload.profesionalId,
        pacienteNombre: payload.pacienteNombre,
        profesionalNombre: payload.profesionalNombre,
        fecha,
        horaInicio: payload.horaInicio,
        horaFin: payload.horaFin,
        duracion: payload.duracionMinutos,
        estado: EstadoTurno.PENDIENTE,
        estadoPago: EstadoPago.PENDIENTE,
        monto: payload.monto,
        pacienteTelefono: payload.pacienteTelefono,
        pacienteDNI: payload.pacienteDNI,
        notificacionesWhatsApp: false,
        tipo: 'consulta',
        colorProfesional: '#4a6fa5',
      });
      this.toast.show('Turno creado', 'success');
      this.modalNuevo.set(false);
    } catch {
      this.toast.show('No se pudo crear el turno', 'error');
    }
  }

  private turnoSolapa(
    profesionalId: string,
    dia: Date,
    horaInicio: string,
    horaFin: string,
    excludeTurnoId?: string,
  ): boolean {
    const turns = this.allTurns() ?? [];
    for (const t of turns) {
      if (excludeTurnoId && t.id === excludeTurnoId) continue;
      if (t.profesionalId !== profesionalId) continue;
      if (
        t.estado === EstadoTurno.CANCELADO ||
        t.estado === EstadoTurno.REPROGRAMADO ||
        t.estado === EstadoTurno.NO_ASISTIO
      ) {
        continue;
      }
      const td = t.fecha.toDate();
      if (
        td.getFullYear() !== dia.getFullYear() ||
        td.getMonth() !== dia.getMonth() ||
        td.getDate() !== dia.getDate()
      ) {
        continue;
      }
      if (horaInicio < t.horaFin && t.horaInicio < horaFin) return true;
    }
    return false;
  }

  private async persistTelefonoWhatsapp(turnoId: string, telefono: string): Promise<void> {
    await this.turnosService.update(turnoId, {
      telefonoNotificaciones: telefono.trim(),
      notificacionesWhatsApp: true,
    });
  }

  private async enviarConfirmacionWhatsapp(turno: Turno, telefono: string): Promise<void> {
    await this.whatsappNotificaciones.enviarConfirmacionTurno({
      telefono,
      pacienteNombre: turno.pacienteNombre,
      fecha: formatFechaPlantillaWhatsapp(turno.fecha.toDate()),
      horaInicio: turno.horaInicio,
      profesionalNombre: turno.profesionalNombre,
    });
  }

  private startMpPolling(externalReference: string): void {
    this.mpPollSub?.unsubscribe();
    this.mpPollSub = timer(0, 3500)
      .pipe(
        switchMap(() => this.mpPayment.estadoPago(externalReference)),
        filter(r => r.status === 'approved'),
        take(1),
      )
      .subscribe({
        next: async () => {
          const wa = this.pagoWhatsappPendienteMp();
          const turno = this.turnoSeleccionado();
          this.pagoWhatsappPendienteMp.set(null);
          let mensaje = 'Pago acreditado en Mercado Pago';
          let variant: 'success' | 'warning' = 'success';
          if (wa && turno) {
            try {
              await this.enviarConfirmacionWhatsapp(turno, wa.telefono);
              mensaje = 'Pago acreditado en Mercado Pago y WhatsApp enviado';
            } catch {
              mensaje = 'Pago acreditado; no se pudo enviar el WhatsApp';
              variant = 'warning';
            }
          }
          this.toast.show(mensaje, variant);
          this.closePagoModal();
        },
        error: () => {
          this.toast.show('No se pudo consultar el estado del pago', 'error');
        },
      });
  }

  private closePagoModal(): void {
    this.mpPollSub?.unsubscribe();
    this.mpPollSub = undefined;
    this.pagoWhatsappPendienteMp.set(null);
    this.modalPago.set(false);
    this.pagoMpPhase.set('idle');
    this.pagoMpCheckout.set(null);
    this.pagoMpError.set(null);
    this.turnoSeleccionado.set(null);
  }
}

function parseMpHttpError(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 409) {
      return 'El cobro está en proceso. Esperá unos segundos e intentá de nuevo.';
    }
    const body = err.error;
    if (body && typeof body === 'object' && 'error' in body) {
      const e = (body as { error?: unknown }).error;
      if (typeof e === 'string') return e;
    }
    if (
      body &&
      typeof body === 'object' &&
      'message' in body &&
      typeof (body as { message?: unknown }).message === 'string'
    ) {
      return (body as { message: string }).message;
    }
    return err.message || 'Error al comunicarse con Mercado Pago';
  }
  if (err instanceof Error) return err.message;
  return 'Error desconocido';
}
