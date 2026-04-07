import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { UiPageHeaderComponent, UiEmptyStateComponent } from '@derma/ui';
import { NotificacionesStateService } from '../../../../core/services/notificaciones-state.service';
import { NotificacionAdmin, TipoNotificacionAdmin } from '@derma/models';
import { NotificacionItemComponent } from '../../ui/notificacion-item/notificacion-item.component';
import { ConfirmEliminarNotifModalComponent } from '../../ui/confirm-eliminar-notif-modal/confirm-eliminar-notif-modal.component';

type FiltroEstado = 'todas' | 'no_leidas' | 'leidas';
type FiltroTipo   = 'todos' | TipoNotificacionAdmin;

@Component({
  selector: 'app-notificaciones-page',
  standalone: true,
  imports: [UiPageHeaderComponent, UiEmptyStateComponent, NotificacionItemComponent, ConfirmEliminarNotifModalComponent],
  templateUrl: './notificaciones-page.component.html',
  styleUrl: './notificaciones-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificacionesPageComponent {
  readonly state = inject(NotificacionesStateService);

  filtroEstado = signal<FiltroEstado>('todas');
  filtroTipo   = signal<FiltroTipo>('todos');

  seleccionadas = signal<Set<string>>(new Set());
  showModal     = signal(false);
  isBulkLoading = signal(false);

  filtradas = computed(() => {
    let lista = this.state.todas();

    switch (this.filtroEstado()) {
      case 'no_leidas': lista = lista.filter(n => !n.leida); break;
      case 'leidas':    lista = lista.filter(n =>  n.leida); break;
    }

    if (this.filtroTipo() !== 'todos') {
      lista = lista.filter(n => n.tipo === this.filtroTipo());
    }

    return lista;
  });

  haySeleccion     = computed(() => this.seleccionadas().size > 0);
  todasSeleccionadas = computed(() =>
    this.filtradas().length > 0 && this.seleccionadas().size === this.filtradas().length
  );

  readonly tiposFiltros: { value: FiltroTipo; label: string }[] = [
    { value: 'todos',             label: 'Todos'      },
    { value: 'tarea_asignada',    label: 'Asignadas'  },
    { value: 'tarea_en_revision', label: 'En revisión'},
    { value: 'tarea_aprobada',    label: 'Aprobadas'  },
    { value: 'tarea_comentario',  label: 'Comentarios'},
    { value: 'tarea_por_vencer',  label: 'Por vencer' },
    { value: 'tarea_vencida',     label: 'Vencidas'   },
  ];

  setFiltroEstado(f: FiltroEstado): void {
    this.filtroEstado.set(f);
    this.seleccionadas.set(new Set());
  }

  setFiltroTipo(f: FiltroTipo): void {
    this.filtroTipo.set(f);
    this.seleccionadas.set(new Set());
  }

  toggleSeleccion(id: string, chequeado: boolean): void {
    this.seleccionadas.update(s => {
      const next = new Set(s);
      chequeado ? next.add(id) : next.delete(id);
      return next;
    });
  }

  toggleSeleccionarTodas(): void {
    if (this.todasSeleccionadas()) {
      this.seleccionadas.set(new Set());
    } else {
      this.seleccionadas.set(new Set(this.filtradas().map(n => n.id)));
    }
  }

  async onAccion(notif: NotificacionAdmin, accion: string): Promise<void> {
    switch (accion) {
      case 'navegar':      await this.state.navegarA(notif);     break;
      case 'marcar_leida': await this.state.marcarLeida(notif.id); break;
      case 'eliminar':     await this.state.eliminar(notif.id);    break;
    }
  }

  async marcarSeleccionadasLeidas(): Promise<void> {
    this.isBulkLoading.set(true);
    const ids = [...this.seleccionadas()];
    await Promise.all(ids.map(id => this.state.marcarLeida(id)));
    this.seleccionadas.set(new Set());
    this.isBulkLoading.set(false);
  }

  async eliminarSeleccionadas(): Promise<void> {
    this.isBulkLoading.set(true);
    const ids = [...this.seleccionadas()];
    await Promise.all(ids.map(id => this.state.eliminar(id)));
    this.seleccionadas.set(new Set());
    this.isBulkLoading.set(false);
  }

  async onEliminarTodas(): Promise<void> {
    await this.state.eliminarTodas();
    this.showModal.set(false);
    this.seleccionadas.set(new Set());
  }

  clearSeleccion(): void {
    this.seleccionadas.set(new Set());
  }

  isSelected(id: string): boolean {
    return this.seleccionadas().has(id);
  }
}
