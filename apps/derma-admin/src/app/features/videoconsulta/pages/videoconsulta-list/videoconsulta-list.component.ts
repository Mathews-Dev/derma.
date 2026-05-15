import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  UiPageHeaderComponent,
  UiButtonComponent,
  UiBadgeComponent,
  UiEmptyStateComponent,
} from '@derma/ui';
import { videoconsultaMockListRows, type VideoconsultaListRow } from '../../videoconsulta-mock';

@Component({
  selector: 'derm-videoconsulta-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    UiPageHeaderComponent,
    UiBadgeComponent,
    UiEmptyStateComponent,
  ],
  templateUrl: './videoconsulta-list.component.html',
  styleUrl: './videoconsulta-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoconsultaListComponent {
  readonly busqueda = signal('');

  private readonly filas = signal<VideoconsultaListRow[]>(videoconsultaMockListRows());

  readonly filtradas = computed(() => {
    const q = this.busqueda().toLowerCase().trim();
    const rows = this.filas();
    if (!q) return rows;
    return rows.filter(
      r =>
        r.pacienteNombre.toLowerCase().includes(q) ||
        r.profesionalNombre.toLowerCase().includes(q) ||
        r.codigo.toLowerCase().includes(q),
    );
  });

  linkBadgeStatus(row: VideoconsultaListRow): 'neutral' | 'success' | 'danger' | 'warning' {
    switch (row.linkEstado) {
      case 'listo':
        return 'success';
      case 'error':
        return 'danger';
      case 'pendiente':
        return 'warning';
      default:
        return 'neutral';
    }
  }

  linkBadgeLabel(row: VideoconsultaListRow): string {
    switch (row.linkEstado) {
      case 'listo':
        return 'Meet listo';
      case 'pendiente':
        return 'Link pendiente';
      case 'error':
        return 'Error';
      default:
        return '—';
    }
  }
}
