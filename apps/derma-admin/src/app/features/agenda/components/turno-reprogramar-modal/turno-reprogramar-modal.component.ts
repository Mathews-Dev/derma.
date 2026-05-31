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
import { EstadoPago, EstadoTurno, Profesional, Turno } from '@derma/models';
import {
  franjasDelDia,
  generarSlotsEnFranja,
  textoFranjasDelDia,
  turnoDentroDeDisponibilidadProfesional,
} from '../../disponibilidad/disponibilidad-agenda.utils';

export interface TurnoReprogramarConfirmPayload {
  nuevaFecha: Date;
  horaInicio: string;
  horaFin: string;
  motivo: string;
}

interface FranjaSlotsVm {
  label: string;
  horaInicio: string;
  horaFin: string;
  slots: { hora: string; ocupado: boolean }[];
  disponibles: number;
}

const DS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const DS_FULL = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

@Component({
  selector: 'derm-turno-reprogramar-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './turno-reprogramar-modal.component.html',
  styleUrl: './turno-reprogramar-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TurnoReprogramarModalComponent {
  turno = input.required<Turno>();
  profesional = input.required<Profesional>();
  turnosOcupados = input<Turno[]>([]);
  fechaSeleccionada = input<Date>();
  guardando = input(false);

  confirm = output<TurnoReprogramarConfirmPayload>();
  close = output<void>();

  motivo = signal('');
  horaInicio = signal('');

  readonly diasSemanaFull = DS_FULL;

  fechaTurno = linkedSignal(() => {
    const hoy = startOfDay(new Date());
    const desdeAgenda = this.fechaSeleccionada();
    const turnoD = startOfDay(this.turno().fecha.toDate());
    const candidata = desdeAgenda ? startOfDay(desdeAgenda) : turnoD;
    return candidata < hoy ? hoy : candidata;
  });

  duracionMin = computed(() => {
    const t = this.turno();
    return t.duracion ?? this.profesional().duracionConsulta ?? 30;
  });

  horaFin = computed(() => {
    const hi = this.horaInicio();
    return hi ? addMinutesToHhMm(hi, this.duracionMin()) : '';
  });

  fechasCarousel = computed(() => {
    const arr: Date[] = [];
    const base = startOfDay(new Date());
    for (let i = 0; i < 21; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      arr.push(d);
    }
    return arr;
  });

  profesionalNombre = computed(() => {
    const p = this.profesional();
    return `Dr. ${p.nombre} ${p.apellido}`.trim();
  });

  turnoActualResumen = computed(() => {
    const t = this.turno();
    const d = t.fecha.toDate();
    return `${d.getDate()} ${MS_SHORT[d.getMonth()]} · ${t.horaInicio}–${t.horaFin}`;
  });

  turnoNuevoResumen = computed(() => {
    const hi = this.horaInicio();
    if (!hi) return null;
    const d = this.fechaTurno();
    return `${d.getDate()} ${MS_SHORT[d.getMonth()]} · ${hi}–${this.horaFin()}`;
  });

  pagoYaRealizado = computed(() => {
    const ep = this.turno().estadoPago;
    return ep === EstadoPago.PAGADO || ep === EstadoPago.PARCIAL;
  });

  horasOcupadas = computed(() => {
    const pid = this.profesional().uid;
    const fecha = this.fechaTurno();
    const excluirId = this.turno().id;
    const ocupadas = new Set<string>();
    for (const t of this.turnosOcupados()) {
      if (t.id === excluirId) continue;
      if (t.profesionalId !== pid) continue;
      if ([EstadoTurno.CANCELADO, EstadoTurno.REPROGRAMADO, EstadoTurno.NO_ASISTIO].includes(t.estado)) {
        continue;
      }
      const td = t.fecha.toDate();
      if (!this.mismaFecha(td, fecha)) continue;
      ocupadas.add(t.horaInicio);
    }
    return ocupadas;
  });

  franjasSlots = computed((): FranjaSlotsVm[] => {
    const prof = this.profesional();
    const fecha = this.fechaTurno();
    const franjas = franjasDelDia(prof.horariosLaborales, fecha);
    const dur = this.duracionMin();
    const ocupadas = this.horasOcupadas();
    return franjas.map(fr => {
      const slots = generarSlotsEnFranja(fr.horaInicio, fr.horaFin, dur).map(hora => ({
        hora,
        ocupado: ocupadas.has(hora),
      }));
      return {
        label: fr.horaInicio < '12:00' ? 'Mañana' : 'Tarde',
        horaInicio: fr.horaInicio,
        horaFin: fr.horaFin,
        slots,
        disponibles: slots.filter(s => !s.ocupado).length,
      };
    });
  });

  /** Una sola grilla compacta con todos los slots del día. */
  slotsDelDia = computed(() => this.franjasSlots().flatMap(f => f.slots));

  hintFranjasDia = computed(() =>
    textoFranjasDelDia(this.profesional().horariosLaborales, this.fechaTurno()),
  );

  errorDisponibilidad = computed(() => {
    const hi = this.horaInicio();
    if (!hi) return null;
    const r = turnoDentroDeDisponibilidadProfesional(
      this.profesional(),
      this.fechaTurno(),
      hi,
      this.horaFin(),
    );
    return r.ok ? null : r.mensaje;
  });

  puedeConfirmar = computed(
    () =>
      !!this.horaInicio() &&
      !this.errorDisponibilidad() &&
      this.motivo().trim().length >= 5 &&
      !this.guardando(),
  );

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (!this.guardando()) this.close.emit();
  }

  seleccionarFecha(fecha: Date): void {
    if (!this.fechaTieneFranjas(fecha) || this.guardando()) return;
    this.fechaTurno.set(startOfDay(fecha));
    this.horaInicio.set('');
  }

  seleccionarSlot(hora: string, ocupado: boolean): void {
    if (!ocupado && !this.guardando()) this.horaInicio.set(hora);
  }

  fechaTieneFranjas(fecha: Date): boolean {
    return franjasDelDia(this.profesional().horariosLaborales, fecha).length > 0;
  }

  mismaFecha(a: Date, b: Date): boolean {
    return a.toDateString() === b.toDateString();
  }

  diaSemanaCorto(d: Date): string {
    return DS[d.getDay()];
  }

  mesCorto(d: Date): string {
    return MS_SHORT[d.getMonth()];
  }

  onConfirm(): void {
    if (!this.puedeConfirmar()) return;
    const fecha = this.fechaTurno();
    this.confirm.emit({
      nuevaFecha: new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()),
      horaInicio: this.horaInicio(),
      horaFin: this.horaFin(),
      motivo: this.motivo().trim(),
    });
  }
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addMinutesToHhMm(hhmm: string, mins: number): string {
  const [h = 0, m = 0] = hhmm.split(':').map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}
