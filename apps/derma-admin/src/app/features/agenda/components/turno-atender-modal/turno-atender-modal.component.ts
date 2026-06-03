import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Turno } from '@derma/models';
import { esVideoconsultaTurno } from '../../../videoconsulta/utils/videoconsulta-turno.utils';

export interface TurnoAtenderConfirmPayload {
  notasProfesional?: string;
}

const DS_FULL = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

@Component({
  selector: 'derm-turno-atender-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './turno-atender-modal.component.html',
  styleUrl: './turno-atender-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TurnoAtenderModalComponent {
  turno = input.required<Turno>();
  guardando = input(false);

  confirm = output<TurnoAtenderConfirmPayload>();
  close = output<void>();

  notas = signal('');

  titulo = computed(() =>
    esVideoconsultaTurno(this.turno()) ? 'Finalizar videoconsulta' : 'Marcar turno como atendido',
  );

  turnoResumen = computed(() => {
    const t = this.turno();
    const d = t.fecha.toDate();
    return `${DS_FULL[d.getDay()]} ${d.getDate()} ${MS_SHORT[d.getMonth()]} · ${t.horaInicio}–${t.horaFin}`;
  });

  puedeConfirmar = computed(() => !this.guardando());

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (!this.guardando()) this.close.emit();
  }

  onConfirm(): void {
    if (!this.puedeConfirmar()) return;
    const trimmed = this.notas().trim();
    this.confirm.emit(trimmed ? { notasProfesional: trimmed } : {});
  }
}
