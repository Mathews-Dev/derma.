import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  UiPageHeaderComponent,
  UiBadgeComponent,
  UiEmptyStateComponent,
} from '@derma/ui';
import type { VideoconsultaListRow } from '../../models/videoconsulta.view-model';
import { VideoconsultaService } from '../../data-access/videoconsulta.service';

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
  private readonly videoconsultaService = inject(VideoconsultaService);
  private readonly rango = VideoconsultaService.defaultRango();

  readonly busqueda = signal('');

  private readonly filas = toSignal(
    this.videoconsultaService.videoconsultaListRows$(this.rango.desde, this.rango.hasta),
    { initialValue: [] as VideoconsultaListRow[] },
  );

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
      case 'sin_crear':
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
      case 'sin_crear':
        return 'Sin crear';
      case 'error':
        return 'Error';
      default:
        return '—';
    }
  }
}
