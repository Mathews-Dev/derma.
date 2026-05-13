import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Profesional, RolUsuario, EstadoUsuario, Usuario } from '@derma/models';
import { FirestoreService } from '@derma/firebase';
import { firstValueFrom } from 'rxjs';
import {
  textoFranjasDelDia,
  turnoDentroDeDisponibilidadProfesional,
} from '../../disponibilidad/disponibilidad-agenda.utils';

export interface TurnoNuevoPayload {
  pacienteId: string;
  pacienteNombre: string;
  pacienteTelefono: string | null;
  pacienteDNI: string | null;
  profesionalId: string;
  profesionalNombre: string;
  horaInicio: string;
  horaFin: string;
  duracionMinutos: number;
  monto: number;
}

@Component({
  selector: 'derm-turno-nuevo-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './turno-nuevo-modal.component.html',
  styleUrl: './turno-nuevo-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TurnoNuevoModalComponent {
  private readonly fs = inject(FirestoreService);

  profesionales = input.required<Profesional[]>();
  fechaSeleccionada = input.required<Date>();

  confirm = output<TurnoNuevoPayload>();
  close = output<void>();

  // ─── Paciente (selección / alta rápida) ──────────────────────────────────
  pacienteSeleccionado = signal<Usuario | null>(null);
  dniLookup = signal('');
  telefonoLookup = signal('');
  buscando = signal(false);
  busquedaError = signal<string | null>(null);

  nombre = signal('');
  apellido = signal('');
  telefono = signal('');
  dni = signal('');
  profesionalId = signal('');
  horaInicio = signal('09:00');
  monto = linkedSignal(() => {
    const id = this.profesionalId();
    const p = this.profesionales().find(x => x.uid === id);
    return p?.precioConsulta ?? 0;
  });

  profesionalNombreSel = computed(() => {
    const p = this.profesionales().find(x => x.uid === this.profesionalId());
    return p ? `${p.nombre} ${p.apellido}`.trim() : '';
  });

  duracionSel = computed(() => {
    const p = this.profesionales().find(x => x.uid === this.profesionalId());
    return p?.duracionConsulta ?? 30;
  });

  hintFranjasDia = computed(() => {
    const p = this.profesionales().find(x => x.uid === this.profesionalId());
    return textoFranjasDelDia(p?.horariosLaborales, this.fechaSeleccionada());
  });

  errorDisponibilidad = computed(() => {
    const pid = this.profesionalId();
    const p = this.profesionales().find(x => x.uid === pid);
    const hi = this.horaInicio();
    if (!pid || !hi) return null;
    const dur = this.duracionSel();
    const hf = addMinutesToHhMm(hi, dur);
    const r = turnoDentroDeDisponibilidadProfesional(p, this.fechaSeleccionada(), hi, hf);
    return r.ok ? null : r.mensaje;
  });

  puedeConfirmar = computed(() => {
    const nom = this.nombre().trim();
    const ape = this.apellido().trim();
    const pid = this.profesionalId();
    const hi = this.horaInicio();
    const m = this.monto();
    return (
      nom.length >= 2 &&
      ape.length >= 2 &&
      !!pid &&
      !!hi &&
      m > 0 &&
      !this.errorDisponibilidad()
    );
  });

  @HostListener('document:keydown.escape') onEsc(): void {
    this.close.emit();
  }

  onProfesionalChange(uid: string): void {
    this.profesionalId.set(uid);
    const p = this.profesionales().find(x => x.uid === uid);
    if (p?.precioConsulta != null && p.precioConsulta > 0) {
      // linkedSignal on monto tracks profesionalId; force display via profesional change is enough
    }
  }

  onConfirm(): void {
    if (!this.puedeConfirmar()) return;
    const dur = this.duracionSel();
    const hi = this.horaInicio();
    const hf = addMinutesToHhMm(hi, dur);
    const nombreCompleto = `${this.nombre().trim()} ${this.apellido().trim()}`.trim();

    const paciente = this.pacienteSeleccionado();
    const pacienteId = paciente?.uid ?? this.fs.createId();
    const pacienteTelefono = (paciente?.telefono ?? this.telefono().trim()) || null;
    const pacienteDNI = (paciente?.dni ?? this.dni().trim()) || null;

    if (!paciente) {
      void this.crearPacienteBasico(pacienteId);
    }

    this.confirm.emit({
      pacienteId,
      pacienteNombre: nombreCompleto,
      pacienteTelefono,
      pacienteDNI,
      profesionalId: this.profesionalId(),
      profesionalNombre: this.profesionalNombreSel(),
      horaInicio: hi,
      horaFin: hf,
      duracionMinutos: dur,
      monto: this.monto(),
    });
  }

  async buscarPacientePorDni(): Promise<void> {
    const dni = this.dniLookup().trim();
    this.busquedaError.set(null);
    if (!dni) return;
    this.buscando.set(true);
    try {
      const res = await firstValueFrom(this.fs.getCollectionByFilter<Usuario>('usuarios', 'dni', dni));
      const paciente = res.find(u => u.rol === RolUsuario.PACIENTE) ?? null;
      if (!paciente) {
        this.busquedaError.set('No se encontró paciente con ese DNI. Podés crearlo con datos básicos.');
        this.pacienteSeleccionado.set(null);
        return;
      }
      this.seleccionarPaciente(paciente);
    } catch {
      this.busquedaError.set('Error buscando paciente. Intentá de nuevo.');
    } finally {
      this.buscando.set(false);
    }
  }

  async buscarPacientePorTelefono(): Promise<void> {
    const tel = this.telefonoLookup().trim();
    this.busquedaError.set(null);
    if (!tel) return;
    this.buscando.set(true);
    try {
      const res = await firstValueFrom(this.fs.getCollectionByFilter<Usuario>('usuarios', 'telefono', tel));
      const paciente = res.find(u => u.rol === RolUsuario.PACIENTE) ?? null;
      if (!paciente) {
        this.busquedaError.set('No se encontró paciente con ese teléfono. Podés crearlo con datos básicos.');
        this.pacienteSeleccionado.set(null);
        return;
      }
      this.seleccionarPaciente(paciente);
    } catch {
      this.busquedaError.set('Error buscando paciente. Intentá de nuevo.');
    } finally {
      this.buscando.set(false);
    }
  }

  limpiarSeleccionPaciente(): void {
    this.pacienteSeleccionado.set(null);
  }

  private seleccionarPaciente(p: Usuario): void {
    this.pacienteSeleccionado.set(p);
    this.nombre.set(p.nombre ?? '');
    this.apellido.set(p.apellido ?? '');
    this.telefono.set(p.telefono ?? '');
    this.dni.set(p.dni ?? '');
  }

  private async crearPacienteBasico(uid: string): Promise<void> {
    const paciente: Usuario = {
      uid,
      email: '',
      nombre: this.nombre().trim(),
      apellido: this.apellido().trim(),
      dni: this.dni().trim() || undefined,
      telefono: this.telefono().trim(),
      rol: RolUsuario.PACIENTE,
      estado: EstadoUsuario.ACTIVO,
      correoVerificado: false,
    };
    try {
      await this.fs.setDocument('usuarios', uid, paciente);
      this.pacienteSeleccionado.set(paciente);
    } catch {
      // si falla, el turno igual puede quedar con datos denormalizados; se reintenta desde pacientes
    }
  }

  fmtFecha(d: Date): string {
    return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  }
}

function addMinutesToHhMm(hhmm: string, mins: number): string {
  const parts = hhmm.split(':').map(Number);
  const h = parts[0] ?? 0;
  const m = parts[1] ?? 0;
  const total = h * 60 + m + mins;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}
