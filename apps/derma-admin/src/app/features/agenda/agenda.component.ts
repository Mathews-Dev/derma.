import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap, map, startWith } from 'rxjs';
import {
  AgendaSidebarComponent,
  CalendarGridComponent,
  AgendaListComponent,
  AgendaFilters,
  defaultAgendaFilters,
  UiPageHeaderComponent,
  UiButtonComponent,
  TooltipComponent,
  ProfesionalSidebar,
} from '@derma/ui';
import { TurnosService } from '@derma/firebase';
import { Turno, AccionTurno, Profesional, RolUsuario } from '@derma/models';
import { FirestoreService } from '@derma/firebase';
import { toObservable } from '@angular/core/rxjs-interop';
import { TurnoDetalleModalComponent } from './components/turno-detalle-modal/turno-detalle-modal.component';
import { TurnoCancelarModalComponent } from './components/turno-cancelar-modal/turno-cancelar-modal.component';
import { TurnoReprogramarModalComponent } from './components/turno-reprogramar-modal/turno-reprogramar-modal.component';
import { TurnoPagoModalComponent } from './components/turno-pago-modal/turno-pago-modal.component';
import { ToastService } from '@derma/ui';

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
  ],
  templateUrl: './agenda.component.html',
  styleUrl: './agenda.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
// Force IDE cache refresh
export class AgendaComponent implements OnInit {
  private readonly turnosService = inject(TurnosService);
  private readonly firestoreService = inject(FirestoreService);
  private readonly toast = inject(ToastService);

  // ─── UI State ─────────────────────────────────────────────────────────────
  selectedDate    = signal(new Date());
  viewMode        = signal<'day' | 'week'>('day');
  filters         = signal<AgendaFilters>(defaultAgendaFilters());
  search          = signal('');
  sidebarCollapsed     = signal(false);
  rightPanelCollapsed  = signal(false);

  // ─── Modal State ──────────────────────────────────────────────────────────
  turnoSeleccionado = signal<Turno | null>(null);
  modalDetalle      = signal(false);
  modalCancelar     = signal(false);
  modalReprogramar  = signal(false);
  modalPago         = signal(false);

  // ─── Profesionales (para el sidebar) ─────────────────────────────────────
  profesionales$ = this.firestoreService.getCollectionByFilter<Profesional>(
    'usuarios',
    'rol',
    RolUsuario.DERMATOLOGO,
  );

  profesionalesSidebar = toSignal(
    this.profesionales$.pipe(
      map(profs => profs.map(p => ({
        id: p.uid,
        nombre: p.nombre,
        apellido: p.apellido,
      } as ProfesionalSidebar))),
      startWith([] as ProfesionalSidebar[])
    )
  );

  // ─── Rango de fechas según la vista ──────────────────────────────────────
  private dateRange = computed(() => {
    const d = this.selectedDate();
    if (this.viewMode() === 'day') {
      return { desde: d, hasta: d };
    }
    // Vista semana: lunes a domingo
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
    switchMap(({ desde, hasta }) =>
      this.turnosService.getTurnosByRango(desde, hasta, CLINICA_ID)
    )
  );

  allTurns = toSignal(
    this.turns$.pipe(startWith([] as Turno[]))
  );

  // ─── Filtrado reactivo en memoria ─────────────────────────────────────────
  filteredTurns = computed(() => {
    const f       = this.filters();
    const q       = this.search().toLowerCase().trim();
    const turns   = this.allTurns() ?? [];

    return turns.filter((t: Turno) => {
      if (f.profesionalesIds.length > 0 && !f.profesionalesIds.includes(t.profesionalId)) return false;
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
    const fecha  = this.selectedDate();
    const turns  = this.filteredTurns() ?? [];
    return turns
      .filter((t: Turno) => {
        const td = t.fecha.toDate();
        return td.getFullYear() === fecha.getFullYear() &&
               td.getMonth() === fecha.getMonth() &&
               td.getDate() === fecha.getDate();
      })
      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  });

  ngOnInit() {
    // La carga es automática via signals/observables reactivos
  }

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
    try {
      await this.turnosService.update(e.id, {
        horaInicio: e.newStart,
        horaFin: e.newEnd,
      });
      this.toast.show('Turno reprogramado', 'success');
    } catch (err) {
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
    } catch (err) {
      this.toast.show('Error al ejecutar la acción', 'error');
      console.error('[AgendaComponent] Error en acción:', e.accion, err);
    }
  }

  onNewTurn() {
    // TODO: abrir modal de nuevo turno (fase posterior)
    console.log('[AgendaComponent] Nuevo turno — próximamente');
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

  async onReprogramarConfirm(e: { nuevaFecha: Date; horaInicio: string; horaFin: string; motivo: string }) {
    const t = this.turnoSeleccionado();
    if (!t) return;
    try {
      const { Timestamp } = await import('firebase/firestore');
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

  async onPagoConfirm(e: { tipo: 'efectivo' | 'mercado_pago'; monto: number }) {
    const t = this.turnoSeleccionado();
    if (!t) return;
    try {
      if (e.tipo === 'efectivo') {
        await this.turnosService.registrarPagoEfectivo(t.id, e.monto);
        this.toast.show('Pago en efectivo registrado', 'success');
      } else {
        // MP: por ahora solo registra la intención; el webhook del backend completa
        await this.turnosService.registrarPagoMP(t.id, { mpStatus: 'pending' });
        this.toast.show('Pago con MP iniciado — esperando confirmación', 'default');
      }
    } catch {
      this.toast.show('Error al registrar el pago', 'error');
    } finally {
      this.modalPago.set(false);
      this.turnoSeleccionado.set(null);
    }
  }

  onPagoClose() {
    this.modalPago.set(false);
  }
}
