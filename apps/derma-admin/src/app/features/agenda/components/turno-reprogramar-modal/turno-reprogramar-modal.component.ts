import { ChangeDetectionStrategy, Component, HostListener, input, output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Turno } from '@derma/models';

@Component({
  selector: 'derm-turno-reprogramar-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './turno-reprogramar-modal.component.html',
  styleUrl: './turno-reprogramar-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
// Force IDE cache refresh
export class TurnoReprogramarModalComponent implements OnInit {
  turno   = input.required<Turno>();
  confirm = output<{ nuevaFecha: Date; horaInicio: string; horaFin: string; motivo: string }>();
  close   = output<void>();

  nuevaFechaStr = signal('');
  horaInicio    = signal('');
  horaFin       = signal('');
  motivo        = signal('');

  @HostListener('document:keydown.escape') onEsc() { this.close.emit(); }

  ngOnInit() {
    const t = this.turno();
    const d = t.fecha?.toDate ? t.fecha.toDate() : new Date();
    this.nuevaFechaStr.set(d.toISOString().split('T')[0]);
    this.horaInicio.set(t.horaInicio);
    this.horaFin.set(t.horaFin);
  }

  get canConfirm(): boolean {
    return !!this.nuevaFechaStr() && !!this.horaInicio() && !!this.horaFin() && this.motivo().trim().length >= 5;
  }

  onConfirm() {
    if (!this.canConfirm) return;
    const nuevaFecha = new Date(this.nuevaFechaStr() + 'T12:00:00');
    this.confirm.emit({
      nuevaFecha,
      horaInicio: this.horaInicio(),
      horaFin:    this.horaFin(),
      motivo:     this.motivo(),
    });
  }
}
