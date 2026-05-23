import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  NgZone,
  OnDestroy,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Profesional,
  RolUsuario,
  EstadoUsuario,
  EstadoPago,
  EstadoTurno,
  MetodoPago,
  Usuario,
  ModalidadConsulta,
  Turno,
} from '@derma/models';
import { FirestoreService, TurnosService, SlotOcupadoError } from '@derma/firebase';
import { filter, firstValueFrom, Subscription, take } from 'rxjs';
import { Timestamp } from 'firebase/firestore';
import {
  franjasDelDia,
  generarSlotsEnFranja,
  textoFranjasDelDia,
  turnoDentroDeDisponibilidadProfesional,
} from '../../disponibilidad/disponibilidad-agenda.utils';
import { PagoExitoPigComponent } from '../pago-exito-pig/pago-exito-pig.component';
import {
  UiPhoneInputComponent,
  ToastService,
  formatPhoneNumberByIso,
  isValidLocalPhone,
  parsePhoneNumber,
} from '@derma/ui';
import { MercadoPagoPaymentService, createIdempotencyKey } from '@derma/mercadopago';
import {
  formatFechaPlantillaWhatsapp,
  WhatsappNotificacionesService,
} from '../../data-access/whatsapp-notificaciones.service';

/** ID de clínica hardcodeado por ahora. En el futuro vendrá de AuthService/contexto. */
const CLINICA_ID = 'clinica_default';

/** Tiempo máximo de espera para que MP confirme el pago (10 minutos). */
const MP_TIMEOUT_MS = 10 * 60 * 1000;

export type FasePago = 'esperando' | 'generando' | 'listo_qr' | 'pagado' | 'error';

// Mantenemos TurnoNuevoPayload para compatibilidad con cualquier otro uso externo.
export interface TurnoNuevoPayload {
  pacienteId: string;
  pacienteNombre: string;
  pacienteTelefono: string | null;
  telefonoNotificaciones: string | null;
  pacienteDNI: string | null;
  profesionalId: string;
  profesionalNombre: string;
  fechaTurno: Date;
  horaInicio: string;
  horaFin: string;
  duracionMinutos: number;
  monto: number;
  modalidadConsulta: ModalidadConsulta;
}

interface FranjaSlotsVm {
  label: string;
  horaInicio: string;
  horaFin: string;
  slots: { hora: string; ocupado: boolean }[];
  disponibles: number;
}

const DS       = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const DS_FULL  = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MS       = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

@Component({
  selector: 'derm-turno-nuevo-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    UiPhoneInputComponent,
    PagoExitoPigComponent,
  ],
  templateUrl: './turno-nuevo-modal.component.html',
  styleUrl: './turno-nuevo-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TurnoNuevoModalComponent implements OnDestroy {
  private readonly fs            = inject(FirestoreService);
  private readonly turnosService = inject(TurnosService);
  private readonly mpPayment     = inject(MercadoPagoPaymentService);
  private readonly whatsappNotif = inject(WhatsappNotificacionesService);
  private readonly toast         = inject(ToastService);
  private readonly zone          = inject(NgZone);
  private readonly cdr           = inject(ChangeDetectorRef);

  profesionales     = input.required<Profesional[]>();
  fechaSeleccionada = input.required<Date>();
  turnosOcupados    = input<Turno[]>([]);

  /** Emite cuando el turno fue creado Y el pago fue completado o registrado. */
  turnoConfirmado = output<{ turnoId: string; metodoPago: 'efectivo' | 'mercado_pago'; telefonoNotificaciones: string | null }>();
  close           = output<void>();

  readonly diasSemanaFull = DS_FULL;
  readonly stepAnimRev    = signal(false);

  step = signal(1);

  // ─── Paso 1: Paciente ──────────────────────────────────────────────────────
  pacienteSeleccionado = signal<Usuario | null>(null);
  resultadosBusqueda   = signal<Usuario[]>([]);
  formularioNuevo      = signal(false);
  nomLookup            = signal('');
  dniLookup            = signal('');
  buscando             = signal(false);
  busquedaError        = signal<string | null>(null);

  nombre   = signal('');
  apellido = signal('');
  dni      = signal('');

  nuevoCountryIso = signal('AR');
  nuevoLocal      = signal('');

  waCountryIso = signal('AR');
  waLocal      = signal('');
  /** Si true: el número editado aquí define `telefonoNotificaciones`; si false: siempre la ficha. */
  personalizarTelNotifs = signal(false);
  waError      = signal(false);

  // ─── Paso 2: Turno ─────────────────────────────────────────────────────────
  modalidadConsulta = signal<ModalidadConsulta>('presencial');
  profesionalId     = signal('');
  fechaTurno        = linkedSignal(() => {
    const f = this.fechaSeleccionada();
    return new Date(f.getFullYear(), f.getMonth(), f.getDate());
  });
  horaInicio = signal('');

  monto = linkedSignal(() => {
    const id = this.profesionalId();
    const p  = this.profesionales().find(x => x.uid === id);
    return p?.precioConsulta ?? 0;
  });

  // ─── Paso 3 → 4: crear turno con reserva de slot ──────────────────────────
  guardandoTurno = signal(false);
  errorSlot      = signal<string | null>(null);
  turnoIdCreado  = signal<string | null>(null);

  // ─── Paso 4: Pago ──────────────────────────────────────────────────────────
  tipoPago      = signal<'efectivo' | 'mercado_pago'>('efectivo');
  fasePago      = signal<FasePago>('esperando');
  /** Método usado en la pantalla de éxito (antes de cerrar el modal). */
  metodoPagoExito = signal<'efectivo' | 'mercado_pago' | null>(null);
  /** null = no se intentó; true/false = resultado del envío a Meta. */
  whatsappExitoEnvio = signal<boolean | null>(null);
  datosQR       = signal<{ qr: string | null; linkPago: string } | null>(null);
  errorPago     = signal<string | null>(null);
  emailPago     = signal('');

  /** Timeout si MP no confirma en 10 minutos. */
  private mpEsperaTimeout: ReturnType<typeof setTimeout> | null = null;
  /** Escucha directa al doc del turno (mismo patrón que agenda pago modal). */
  private mpWatchSub: Subscription | null = null;

  // ─── Computeds ─────────────────────────────────────────────────────────────

  fechasCarousel = computed(() => {
    const arr: Date[] = [];
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    for (let i = 0; i < 21; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      arr.push(d);
    }
    return arr;
  });

  profesionalSel = computed(() =>
    this.profesionales().find(x => x.uid === this.profesionalId()),
  );

  profesionalNombreSel = computed(() => {
    const p = this.profesionalSel();
    return p ? `${p.nombre} ${p.apellido}`.trim() : '';
  });

  duracionSel = computed(() => this.profesionalSel()?.duracionConsulta ?? 30);

  horasOcupadas = computed(() => {
    const pid   = this.profesionalId();
    const fecha = this.fechaTurno();
    if (!pid) return new Set<string>();
    const ocupadas = new Set<string>();
    for (const t of this.turnosOcupados()) {
      if (t.profesionalId !== pid) continue;
      if ([EstadoTurno.CANCELADO, EstadoTurno.REPROGRAMADO, EstadoTurno.NO_ASISTIO].includes(t.estado)) continue;
      const td = t.fecha.toDate();
      if (td.getFullYear() !== fecha.getFullYear() || td.getMonth() !== fecha.getMonth() || td.getDate() !== fecha.getDate()) continue;
      ocupadas.add(t.horaInicio);
    }
    return ocupadas;
  });

  franjasSlots = computed((): FranjaSlotsVm[] => {
    const prof  = this.profesionalSel();
    const fecha = this.fechaTurno();
    if (!prof) return [];
    const franjas  = franjasDelDia(prof.horariosLaborales, fecha);
    const dur      = prof.duracionConsulta ?? 30;
    const ocupadas = this.horasOcupadas();
    return franjas.map(fr => {
      const slots = generarSlotsEnFranja(fr.horaInicio, fr.horaFin, dur).map(hora => ({ hora, ocupado: ocupadas.has(hora) }));
      return {
        label:       fr.horaInicio < '12:00' ? 'Mañana' : 'Tarde',
        horaInicio:  fr.horaInicio,
        horaFin:     fr.horaFin,
        slots,
        disponibles: slots.filter(s => !s.ocupado).length,
      };
    });
  });

  hintFranjasDia = computed(() =>
    textoFranjasDelDia(this.profesionalSel()?.horariosLaborales, this.fechaTurno()),
  );

  errorDisponibilidad = computed(() => {
    const pid = this.profesionalId();
    const hi  = this.horaInicio();
    if (!pid || !hi) return null;
    const hf = addMinutesToHhMm(hi, this.duracionSel());
    const r  = turnoDentroDeDisponibilidadProfesional(this.profesionalSel(), this.fechaTurno(), hi, hf);
    return r.ok ? null : r.mensaje;
  });

  telefonoPacienteRegistro = computed(() => {
    const p = this.pacienteSeleccionado();
    if (p?.telefono?.trim()) return p.telefono.trim();
    if (this.formularioNuevo() && isValidLocalPhone(this.nuevoLocal())) {
      return formatPhoneNumberByIso(this.nuevoCountryIso(), this.nuevoLocal());
    }
    return null;
  });

  /** Número que recibirá WhatsApp (`telefonoNotificaciones`): ficha o campo editado. */
  telefonoNotificacionesEfectivo = computed(() => {
    if (!this.personalizarTelNotifs()) {
      const raw = this.telefonoPacienteRegistro();
      if (!raw?.trim()) return '';
      const { country, local } = parsePhoneNumber(raw);
      if (!isValidLocalPhone(local)) return '';
      return formatPhoneNumberByIso(country.isoCode, local);
    }
    if (!isValidLocalPhone(this.waLocal())) return '';
    return formatPhoneNumberByIso(this.waCountryIso(), this.waLocal());
  });

  /** Placeholder con el ejemplo del paciente (para orientar cuando se personaliza). */
  waNotifPlaceholderPaciente = computed(() => {
    const raw = this.telefonoPacienteRegistro();
    if (!raw?.trim()) return '9 11 2345 6789';
    const { local } = parsePhoneNumber(raw);
    return local.replace(/\D/g, '').length >= 6 ? local : '9 11 2345 6789';
  });

  telefonoWhatsappValido = computed(() => {
    if (!this.personalizarTelNotifs()) {
      const raw = this.telefonoPacienteRegistro();
      if (!raw?.trim()) return false;
      const { local } = parsePhoneNumber(raw);
      return isValidLocalPhone(local);
    }
    return isValidLocalPhone(this.waLocal());
  });

  horaFinSel = computed(() => {
    const hi = this.horaInicio();
    return hi ? addMinutesToHhMm(hi, this.duracionSel()) : '';
  });

  puedePaso1 = computed(() => {
    if (this.pacienteSeleccionado()) return this.telefonoWhatsappValido();
    if (this.formularioNuevo()) {
      const base = this.nombre().trim().length >= 2 && this.apellido().trim().length >= 2;
      return this.modalidadConsulta() === 'videoconsulta' ? base && isValidLocalPhone(this.nuevoLocal()) : base;
    }
    return false;
  });

  puedePaso2 = computed(() =>
    !!this.profesionalId() && !!this.horaInicio() && !this.errorDisponibilidad(),
  );

  puedeConfirmar = computed(() => {
    if (this.monto() <= 0) return false;
    if (this.pacienteSeleccionado() && !this.telefonoWhatsappValido()) return false;
    if (this.modalidadConsulta() === 'videoconsulta' && !this.pacienteSeleccionado() && !isValidLocalPhone(this.nuevoLocal())) return false;
    return this.puedePaso1() && this.puedePaso2();
  });

  /** Para MP: el email del paciente ya en ficha o el que escriba el operario. */
  emailPagoEfectivo = computed(() => {
    const fromPaciente = this.pacienteSeleccionado()?.email?.trim() ?? '';
    return fromPaciente.includes('@') ? fromPaciente : this.emailPago().trim();
  });

  puedeIniciarPagoMP = computed(() =>
    this.emailPagoEfectivo().includes('@') && this.fasePago() === 'esperando',
  );

  necesitaEmailMP = computed(() =>
    this.tipoPago() === 'mercado_pago' && !this.emailPagoEfectivo().includes('@'),
  );

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  @HostListener('document:keydown.escape') onEsc(): void {
    if (this.step() < 4) this.close.emit();
  }

  ngOnDestroy(): void {
    this.limpiarEsperaMp();
  }

  // ─── Navegación del wizard ─────────────────────────────────────────────────

  async avanzar(): Promise<void> {
    if (this.step() === 1) {
      if (this.pacienteSeleccionado() && !this.telefonoWhatsappValido()) { this.waError.set(true); return; }
      if (!this.puedePaso1()) return;
    }
    if (this.step() === 2 && !this.puedePaso2()) return;

    if (this.step() === 3) {
      await this.crearTurnoYAvanzar();
      return;
    }

    this.stepAnimRev.set(false);
    this.step.update(s => s + 1);
  }

  retroceder(): void {
    if (this.step() <= 1 || this.step() === 4) return;
    this.stepAnimRev.set(true);
    this.step.update(s => s - 1);
  }

  // ─── Paso 3 → 4: crear turno con reserva de slot ──────────────────────────

  private async crearTurnoYAvanzar(): Promise<void> {
    if (!this.puedeConfirmar() || this.guardandoTurno()) return;
    this.errorSlot.set(null);
    this.guardandoTurno.set(true);

    const paciente      = this.pacienteSeleccionado();
    const pacienteId    = paciente?.uid ?? this.fs.createId();
    const nombreCompleto = `${this.nombre().trim()} ${this.apellido().trim()}`.trim();
    const hi             = this.horaInicio();
    const hf             = addMinutesToHhMm(hi, this.duracionSel());
    const telefonoNotif =
      this.telefonoNotificacionesEfectivo()?.trim()
        || null;
    const fecha = Timestamp.fromDate(new Date(this.fechaTurno().getFullYear(), this.fechaTurno().getMonth(), this.fechaTurno().getDate()));

    if (!paciente) await this.crearPacienteBasico(pacienteId);

    const turnoData: Omit<Turno, 'id' | 'fechaCreacion'> = {
      clinicaId:             CLINICA_ID,
      pacienteId,
      profesionalId:         this.profesionalId(),
      pacienteNombre:        nombreCompleto,
      profesionalNombre:     this.profesionalNombreSel(),
      fecha,
      horaInicio:            hi,
      horaFin:               hf,
      duracion:              this.duracionSel(),
      estado:                EstadoTurno.PENDIENTE,
      estadoPago:            EstadoPago.PENDIENTE,
      monto:                 this.monto(),
      pacienteTelefono:      this.telefonoPacienteRegistro(),
      pacienteDNI:           (paciente?.dni ?? this.dni().trim()) || null,
      pacienteEmail:         paciente?.email?.trim() || null,
      notificacionesWhatsApp: !!(telefonoNotif?.trim()),
      telefonoNotificaciones: telefonoNotif?.trim() ?? null,
      tipo:                  'consulta',
      modalidadConsulta:     this.modalidadConsulta(),
      colorProfesional:      '#4a6fa5',
    };

    try {
      const id = await this.turnosService.createWithSlotLock(turnoData);
      this.turnoIdCreado.set(id);
      this.stepAnimRev.set(false);
      this.step.set(4);
    } catch (e) {
      if (e instanceof SlotOcupadoError) {
        this.errorSlot.set('Este horario acaba de ser tomado por otra persona. Elegí otro horario.');
        this.step.set(2);
      } else {
        this.errorSlot.set('No se pudo crear el turno. Intentá de nuevo.');
      }
    } finally {
      this.guardandoTurno.set(false);
    }
  }

  // ─── Paso 4: Pago ──────────────────────────────────────────────────────────

  async registrarEfectivo(): Promise<void> {
    const turnoId = this.turnoIdCreado();
    if (!turnoId || this.fasePago() !== 'esperando') return;
    this.fasePago.set('generando');
    this.whatsappExitoEnvio.set(null);
    try {
      await this.turnosService.registrarPagoEfectivo(turnoId, this.monto());
      await this.enviarWhatsappConfirmacionSiCorresponde(turnoId);
      this.mostrarExitoPago('efectivo');
    } catch {
      this.fasePago.set('error');
      this.errorPago.set('No se pudo registrar el pago. Intentá de nuevo.');
    }
  }

  async iniciarPagoMP(): Promise<void> {
    const turnoId = this.turnoIdCreado();
    if (!turnoId || !this.puedeIniciarPagoMP()) return;
    this.fasePago.set('generando');
    this.errorPago.set(null);

    const nombrePaciente = `${this.nombre().trim()} ${this.apellido().trim()}`.trim() || 'Paciente';
    try {
      const resp = await firstValueFrom(
        this.mpPayment.crearPreferencia(
          { turnoId, precio: this.monto(), email: this.emailPagoEfectivo(), nombre: nombrePaciente },
          createIdempotencyKey(),
        ),
      );
      if (!resp.success) throw new Error(resp.error ?? 'Error al crear el cobro en Mercado Pago');

      // Guardar datos MP en el turno
      await this.turnosService.registrarPagoMP(turnoId, { mpStatus: 'pending' });

      this.datosQR.set({ qr: resp.qr_code_base64 ?? null, linkPago: resp.init_point ?? '' });
      this.fasePago.set('listo_qr');
      this.escucharPagoMP(turnoId);
    } catch (e) {
      this.fasePago.set('error');
      this.errorPago.set(e instanceof Error ? e.message : 'No se pudo conectar con Mercado Pago.');
    }
  }

  /** Escucha Firestore por id hasta `estadoPago: pagado` (webhook del backend). */
  private escucharPagoMP(turnoId: string): void {
    this.limpiarEsperaMp();

    this.mpWatchSub = this.turnosService.watchById(turnoId).pipe(
      filter(t => t?.estadoPago === EstadoPago.PAGADO),
      take(1),
    ).subscribe(() => {
      this.zone.run(async () => {
        await this.enviarWhatsappConfirmacionSiCorresponde(turnoId);
        this.mostrarExitoPago('mercado_pago');
      });
    });

    this.mpEsperaTimeout = setTimeout(() => {
      if (this.fasePago() !== 'listo_qr') return;
      this.zone.run(() => {
        this.fasePago.set('error');
        this.errorPago.set('El tiempo de espera del pago se agotó. Podés cerrar y registrar el pago luego desde la agenda.');
        this.cdr.markForCheck();
      });
    }, MP_TIMEOUT_MS);
  }

  private limpiarEsperaMp(): void {
    if (this.mpEsperaTimeout) {
      clearTimeout(this.mpEsperaTimeout);
      this.mpEsperaTimeout = null;
    }
    this.mpWatchSub?.unsubscribe();
    this.mpWatchSub = null;
  }

  async cancelarTurnoDesdeStep4(): Promise<void> {
    const turnoId = this.turnoIdCreado();
    if (!turnoId) { this.close.emit(); return; }
    this.limpiarEsperaMp();
    try {
      await this.turnosService.cancelar(turnoId, 'Pago no completado en el wizard de nuevo turno');
    } catch {
      // Si falla la cancelación, el turno queda pendiente — no bloqueamos el cierre
    }
    this.close.emit();
  }

  openCheckout(url: string): void {
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }

  /** Pantalla de éxito con cerdito; el modal se cierra cuando el usuario confirma. */
  private async enviarWhatsappConfirmacionSiCorresponde(turnoId: string): Promise<void> {
    const telefono = this.telefonoNotificacionesEfectivo();
    if (!telefono) {
      this.whatsappExitoEnvio.set(null);
      return;
    }
    try {
      await this.turnosService.update(turnoId, {
        telefonoNotificaciones: telefono,
        notificacionesWhatsApp: true,
      });
      const accessToken = await this.turnosService.ensureAccessToken(turnoId);
      await this.whatsappNotif.enviarConfirmacionTurno({
        telefono,
        pacienteNombre: `${this.nombre().trim()} ${this.apellido().trim()}`.trim(),
        fecha: formatFechaPlantillaWhatsapp(this.fechaTurno()),
        horaInicio: this.horaInicio(),
        profesionalNombre: this.profesionalNombreSel(),
        accessToken,
      });
      this.whatsappExitoEnvio.set(true);
    } catch {
      this.whatsappExitoEnvio.set(false);
      this.toast.show('Turno pagado; no se pudo enviar el WhatsApp', 'warning');
    }
  }

  private mostrarExitoPago(metodo: 'efectivo' | 'mercado_pago'): void {
    this.limpiarEsperaMp();
    this.metodoPagoExito.set(metodo);
    this.fasePago.set('pagado');
    this.cdr.markForCheck();
  }

  confirmarExitoYCerrar(): void {
    const turnoId = this.turnoIdCreado();
    const metodo = this.metodoPagoExito();
    if (turnoId && metodo) {
      this.turnoConfirmado.emit({
        turnoId,
        metodoPago: metodo,
        telefonoNotificaciones: this.telefonoNotificacionesEfectivo() || null,
      });
    }
    this.close.emit();
  }

  // ─── Búsqueda y selección de paciente ─────────────────────────────────────

  async buscarPaciente(): Promise<void> {
    const dni = this.dniLookup().trim();
    const nom = this.nomLookup().trim();
    this.busquedaError.set(null);
    this.resultadosBusqueda.set([]);
    if (!dni && !nom) return;

    this.buscando.set(true);
    try {
      if (dni) {
        const res      = await firstValueFrom(this.fs.getCollectionByFilter<Usuario>('usuarios', 'dni', dni));
        const pacientes = res.filter(u => u.rol === RolUsuario.PACIENTE);
        if (pacientes.length === 1)     this.seleccionarPaciente(pacientes[0]);
        else if (pacientes.length > 1)  this.resultadosBusqueda.set(pacientes);
        else                            this.mostrarFormularioNuevo(`No se encontró paciente con DNI ${dni}.`);
        return;
      }

      const todos   = await firstValueFrom(this.fs.getCollectionByFilter<Usuario>('usuarios', 'rol', RolUsuario.PACIENTE));
      const parts   = nom.toLowerCase().split(/\s+/).filter(Boolean);
      const matches = todos.filter(p => {
        const full = `${p.nombre ?? ''} ${p.apellido ?? ''}`.toLowerCase();
        return parts.every(pt => full.includes(pt));
      });

      if (matches.length === 1)      this.seleccionarPaciente(matches[0]);
      else if (matches.length > 1)   this.resultadosBusqueda.set(matches);
      else                           this.mostrarFormularioNuevo(`No se encontró paciente para "${nom}".`);
    } catch {
      this.busquedaError.set('Error buscando paciente. Intentá de nuevo.');
    } finally {
      this.buscando.set(false);
    }
  }

  seleccionarPacienteDesdeLista(p: Usuario): void { this.seleccionarPaciente(p); }

  limpiarSeleccionPaciente(): void {
    this.pacienteSeleccionado.set(null);
    this.formularioNuevo.set(false);
    this.resultadosBusqueda.set([]);
    this.busquedaError.set(null);
    this.personalizarTelNotifs.set(false);
    this.waCountryIso.set('AR');
    this.waLocal.set('');
    this.nuevoCountryIso.set('AR');
    this.nuevoLocal.set('');
    this.waError.set(false);
    this.nomLookup.set('');
    this.dniLookup.set('');
  }

  onWaInputChange(): void {
    if (this.telefonoWhatsappValido()) this.waError.set(false);
  }

  onPersonalizarNotificacionesTel(checked: boolean): void {
    if (!checked) {
      const raw = this.pacienteSeleccionado()?.telefono?.trim() ?? '';
      const { local } = parsePhoneNumber(raw);
      if (!raw || !isValidLocalPhone(local)) {
        this.toast.show(
          'No hay un celular válido en la ficha. Dejá activa «Usar otro número» y cargalo acá.',
          'default',
        );
        return;
      }
    }
    this.personalizarTelNotifs.set(checked);
    if (!checked) {
      this.aplicarTelefonoPaciente(this.pacienteSeleccionado()?.telefono);
    }
    this.onWaInputChange();
  }

  // ─── Selección de profesional / fecha / slot ───────────────────────────────

  seleccionarProfesional(uid: string): void { this.profesionalId.set(uid); this.horaInicio.set(''); }

  seleccionarFecha(fecha: Date): void {
    if (!this.fechaTieneFranjas(fecha)) return;
    this.fechaTurno.set(new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()));
    this.horaInicio.set('');
  }

  seleccionarSlot(hora: string, ocupado: boolean): void {
    if (!ocupado) this.horaInicio.set(hora);
  }

  // ─── Helpers de formato ────────────────────────────────────────────────────

  iniciales(u: { nombre?: string; apellido?: string }): string {
    return ((u.nombre?.[0] ?? '') + (u.apellido?.[0] ?? '')).toUpperCase() || '?';
  }

  fmtFechaBadge(d: Date): string {
    return `${d.getDate()}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  fmtFechaCompleta(d: Date): string {
    return `${DS_FULL[d.getDay()]} ${d.getDate()} de ${MS[d.getMonth()]} de ${d.getFullYear()}`;
  }

  fmtMonto(n: number): string {
    return '$ ' + n.toLocaleString('es-AR');
  }

  diaSemanaCorto(d: Date): string { return DS[d.getDay()]; }
  mesCorto(d: Date): string { return MS_SHORT[d.getMonth()]; }

  fechaTieneFranjas(fecha: Date): boolean {
    const p = this.profesionalSel();
    return !p || franjasDelDia(p.horariosLaborales, fecha).length > 0;
  }

  mismaFecha(a: Date, b: Date): boolean { return a.toDateString() === b.toDateString(); }

  stepDone(n: number): boolean   { return this.step() > n; }
  stepActive(n: number): boolean { return this.step() === n; }

  // ─── Privados ──────────────────────────────────────────────────────────────

  private mostrarFormularioNuevo(msg: string): void {
    this.pacienteSeleccionado.set(null);
    this.formularioNuevo.set(true);
    this.busquedaError.set(msg);
    const dni = this.dniLookup().trim();
    const nom = this.nomLookup().trim();
    if (dni) this.dni.set(dni);
    if (nom) {
      const pts = nom.split(/\s+/);
      if (pts.length >= 2) { this.nombre.set(pts[0]); this.apellido.set(pts.slice(1).join(' ')); }
      else                   this.nombre.set(nom);
    }
  }

  private seleccionarPaciente(p: Usuario): void {
    this.pacienteSeleccionado.set(p);
    this.formularioNuevo.set(false);
    this.resultadosBusqueda.set([]);
    this.busquedaError.set(null);
    this.nombre.set(p.nombre ?? '');
    this.apellido.set(p.apellido ?? '');
    this.dni.set(p.dni ?? '');
    this.aplicarTelefonoPaciente(p.telefono);
  }

  private aplicarTelefonoPaciente(telefono: string | undefined): void {
    const raw = telefono?.trim() ?? '';
    const { country, local } = parsePhoneNumber(raw);
    this.waCountryIso.set(country.isoCode);
    this.waLocal.set(local);
    const fichaTieneValor = !!raw.length;
    const fichaEsValido = isValidLocalPhone(local);
    /* Sin número o inválido en ficha → hay que cargar/editar aquí mismo. */
    this.personalizarTelNotifs.set(!fichaTieneValor || !fichaEsValido);
    this.waError.set(false);
  }

  private async crearPacienteBasico(uid: string): Promise<void> {
    const paciente: Usuario = {
      uid,
      email:             '',
      nombre:            this.nombre().trim(),
      apellido:          this.apellido().trim(),
      dni:               this.dni().trim() || undefined,
      telefono:          formatPhoneNumberByIso(this.nuevoCountryIso(), this.nuevoLocal()),
      rol:               RolUsuario.PACIENTE,
      estado:            EstadoUsuario.ACTIVO,
      correoVerificado:  false,
    };
    try {
      await this.fs.setDocument('usuarios', uid, paciente);
      this.pacienteSeleccionado.set(paciente);
    } catch {
      // El turno puede crearse igual con datos denormalizados
    }
  }
}

function addMinutesToHhMm(hhmm: string, mins: number): string {
  const [h = 0, m = 0] = hhmm.split(':').map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}
