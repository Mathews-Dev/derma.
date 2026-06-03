import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import {
  UiPageHeaderComponent,
  UiBadgeComponent,
  UiEmptyStateComponent,
} from '@derma/ui';
import type { VideoconsultaListRow } from '../../models/videoconsulta.view-model';
import { VideoconsultaService } from '../../data-access/videoconsulta.service';
import {
  turnoMatchesVideoconsultaFiltro,
  type VideoconsultaListFiltro,
} from '../../utils/videoconsulta-turno.utils';
import { mapTurnoToListRow } from '../../utils/videoconsulta-mapper';
import { VideoconsultaDetalleComponent } from '../videoconsulta-detalle/videoconsulta-detalle.component';
import { Turno } from '@derma/models';

@Component({
  selector: 'derm-videoconsulta-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    UiPageHeaderComponent,
    UiBadgeComponent,
    UiEmptyStateComponent,
    VideoconsultaDetalleComponent,
  ],
  templateUrl: './videoconsulta-list.component.html',
  styleUrl: './videoconsulta-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoconsultaListComponent {
  private readonly videoconsultaService = inject(VideoconsultaService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly rango = VideoconsultaService.defaultRango();

  readonly busqueda = signal('');
  readonly listFiltro = signal<VideoconsultaListFiltro>('proximas');
  readonly detalleId = signal<string | null>(null);

  private readonly queryDetalleId = toSignal(
    this.route.queryParamMap.pipe(map(p => p.get('detalle'))),
    { initialValue: this.route.snapshot.queryParamMap.get('detalle') },
  );

  readonly detalleAbierto = computed(() => this.detalleId() ?? this.queryDetalleId());

  /** Turno del listado ya en memoria → sidebar instantáneo. */
  readonly turnoDetalle = computed((): Turno | null => {
    const id = this.detalleAbierto();
    if (!id) return null;
    return this.turnosVc().find(t => t.id === id) ?? null;
  });

  private readonly turnosVc = toSignal(
    this.videoconsultaService.videoconsultaTurnos$(this.rango.desde, this.rango.hasta),
    { initialValue: [] },
  );

  constructor() {
    effect(() => {
      const turnos = this.turnosVc();
      if (turnos.length === 0) return;
      this.videoconsultaService.prefetchProfesionales(turnos.map(t => t.profesionalId));
    });
  }

  readonly filtradas = computed(() => {
    const q = this.busqueda().toLowerCase().trim();
    const filtro = this.listFiltro();
    let rows = this.turnosVc()
      .filter(t => turnoMatchesVideoconsultaFiltro(t, filtro))
      .map(mapTurnoToListRow);
    if (!q) return rows;
    return rows.filter(
      r =>
        r.pacienteNombre.toLowerCase().includes(q) ||
        r.profesionalNombre.toLowerCase().includes(q) ||
        r.codigo.toLowerCase().includes(q),
    );
  });

  setListFiltro(f: VideoconsultaListFiltro): void {
    this.listFiltro.set(f);
  }

  abrirDetalle(id: string): void {
    this.detalleId.set(id);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { detalle: id },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  cerrarDetalle(): void {
    this.detalleId.set(null);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { detalle: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

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
