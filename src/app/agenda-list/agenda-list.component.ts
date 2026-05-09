import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Turno, STATUS } from '../types';

type StatusKey = keyof typeof STATUS;

@Component({
  selector: 'app-agenda-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './agenda-list.component.html',
  styleUrl: './agenda-list.component.css'
})
export class AgendaListComponent {
  turns = input.required<Turno[]>();
  turnoClick = output<number>();
  quickAction = output<{ id: number; status: string }>();

  get statusMap() {
    return STATUS;
  }

  getStatus(key: string): typeof STATUS[StatusKey] | undefined {
    return STATUS[key as StatusKey];
  }

  getStatusColor(key: string): string {
    const colors: Record<string, string> = {
      pendiente: '#9e8530',
      confirmado: '#3d7a54',
      pagado: '#3b6e90',
      cancelado: '#8c4444',
      atendido: '#605090'
    };
    return colors[key] || 'var(--c-800)';
  }

  getStatusBg(key: string): string {
    const bgs: Record<string, string> = {
      pendiente: 'rgba(158, 133, 48, 0.06)',
      confirmado: 'rgba(61, 122, 84, 0.06)',
      pagado: 'rgba(59, 110, 144, 0.06)',
      cancelado: 'rgba(140, 68, 68, 0.06)',
      atendido: 'rgba(96, 80, 144, 0.06)'
    };
    return bgs[key] || 'var(--c-200)';
  }

  getStatusLabel(key: string): string {
    return this.getStatus(key)?.label || key;
  }

  get statusStats(): [string, number][] {
    const counts: Record<string, number> = { pendiente: 0, confirmado: 0, pagado: 0, cancelado: 0, atendido: 0 };
    this.turns().forEach(t => counts[t.status]++);
    return Object.entries(counts);
  }

  fmtCurrency(n: number): string {
    return '$' + n.toLocaleString('es-AR');
  }

  onCardClick(id: number) {
    this.turnoClick.emit(id);
  }

  onQuickAction(event: Event, id: number, status: string) {
    event.stopPropagation();
    this.quickAction.emit({ id, status });
  }
}