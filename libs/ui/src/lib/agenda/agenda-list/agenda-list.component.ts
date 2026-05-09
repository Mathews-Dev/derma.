import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Turno, STATUS, PAGO_STATUS, AccionTurno } from '../types';

@Component({
  selector: 'ui-agenda-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './agenda-list.component.html',
  styleUrl: './agenda-list.component.css'
})
export class AgendaListComponent {
  turns = input.required<Turno[]>();

  /** Emite el ID (string) del turno clickeado para abrir el detalle. */
  turnoClick = output<string>();

  /** Emite una acción rápida sobre el turno. */
  quickAction = output<{ id: string; accion: AccionTurno }>();

  readonly AccionTurno = AccionTurno;

  get statusMap() {
    return STATUS;
  }

  getStatus(key: string) {
    return STATUS[key];
  }

  getPayStatus(key: string) {
    return PAGO_STATUS[key];
  }

  getStatusColor(key: string): string {
    const colors: Record<string, string> = {
      pendiente:    '#9e8530',
      confirmado:   '#3d7a54',
      atendido:     '#605090',
      cancelado:    '#8c4444',
      no_asistio:   '#8c4444',
      reprogramado: '#9e8530',
      completado:   '#3d7a54',
    };
    return colors[key] || 'var(--c-800)';
  }

  getStatusBg(key: string): string {
    const bgs: Record<string, string> = {
      pendiente:    'rgba(158, 133, 48, 0.06)',
      confirmado:   'rgba(61, 122, 84, 0.06)',
      atendido:     'rgba(96, 80, 144, 0.06)',
      cancelado:    'rgba(140, 68, 68, 0.06)',
      no_asistio:   'rgba(140, 68, 68, 0.06)',
      reprogramado: 'rgba(158, 133, 48, 0.06)',
      completado:   'rgba(61, 122, 84, 0.06)',
    };
    return bgs[key] || 'var(--c-200)';
  }

  getStatusLabel(key: string): string {
    return STATUS[key]?.label || key;
  }

  getPayLabel(key: string): string {
    return PAGO_STATUS[key]?.label || key;
  }

  getPayColor(key: string): string {
    return PAGO_STATUS[key]?.color || 'var(--c-600)';
  }

  getPayBg(key: string): string {
    return PAGO_STATUS[key]?.bg || 'var(--c-100)';
  }

  /** Stats de estado de turno para la barra superior. */
  get statusStats(): [string, number][] {
    const counts: Record<string, number> = {
      pendiente: 0, confirmado: 0, atendido: 0,
      cancelado: 0, no_asistio: 0, reprogramado: 0
    };
    this.turns().forEach((t: Turno) => {
      if (counts[t.estado] !== undefined) counts[t.estado]++;
    });
    return Object.entries(counts).filter(([, n]) => n > 0);
  }

  fmtCurrency(n: number): string {
    return '$\u00a0' + n.toLocaleString('es-AR');
  }

  onCardClick(id: string) {
    this.turnoClick.emit(id);
  }

  onQuickAction(event: Event, id: string, accion: AccionTurno) {
    event.stopPropagation();
    this.quickAction.emit({ id, accion });
  }
}