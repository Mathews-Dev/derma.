import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NotificacionAdmin } from '@derma/models';
import { TooltipComponent } from '@derma/ui';
import { TiempoRelativoPipe, accentPorPrioridad, colorPorTipo, iconoPorTipo } from '../../pipes/tiempo-relativo.pipe';

export type NotificacionAccion = 'navegar' | 'marcar_leida' | 'eliminar';

@Component({
  selector: 'app-notificacion-item',
  standalone: true,
  imports: [TooltipComponent, TiempoRelativoPipe],
  templateUrl: './notificacion-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificacionItemComponent {
  notif      = input.required<NotificacionAdmin>();
  compact    = input<boolean>(false);
  selectable = input<boolean>(false);
  selected   = input<boolean>(false);

  accion    = output<NotificacionAccion>();
  selChange = output<boolean>();

  iconPath      = computed(() => iconoPorTipo(this.notif().tipo));
  iconColor     = computed(() => colorPorTipo(this.notif().tipo));
  priorityClass = computed(() => accentPorPrioridad(this.notif().prioridad));

  onNavegar(): void {
    this.accion.emit('navegar');
  }

  onMarcarLeida(e: Event): void {
    e.stopPropagation();
    this.accion.emit('marcar_leida');
  }

  onEliminar(e: Event): void {
    e.stopPropagation();
    this.accion.emit('eliminar');
  }

  onSelectChange(e: Event): void {
    this.selChange.emit((e.target as HTMLInputElement).checked);
  }
}
