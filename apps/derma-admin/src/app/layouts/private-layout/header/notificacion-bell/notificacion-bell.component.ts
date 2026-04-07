import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NotificacionesStateService } from '../../../../core/services/notificaciones-state.service';
import { NotificacionItemComponent } from '../../../../features/notificaciones/ui/notificacion-item/notificacion-item.component';
import { NotificacionAdmin } from '@derma/models';

@Component({
  selector: 'app-notificacion-bell',
  standalone: true,
  imports: [RouterLink, NotificacionItemComponent],
  templateUrl: './notificacion-bell.component.html',
  styleUrl: './notificacion-bell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'close()'
  }
})
export class NotificacionBellComponent {
  readonly state = inject(NotificacionesStateService);

  isOpen    = signal(false);
  isClosing = signal(false);

  toggle(event: Event): void {
    event.stopPropagation();
    if (this.isOpen()) {
      this.close();
    } else {
      this.isClosing.set(false);
      this.isOpen.set(true);
    }
  }

  close(): void {
    if (!this.isOpen()) return;
    this.isClosing.set(true);
    setTimeout(() => {
      this.isOpen.set(false);
      this.isClosing.set(false);
    }, 250);
  }

  async onNavegar(notif: NotificacionAdmin): Promise<void> {
    this.isOpen.set(false);
    this.isClosing.set(false);
    await this.state.navegarA(notif);
  }

  async onMarcarLeida(notif: NotificacionAdmin): Promise<void> {
    await this.state.marcarLeida(notif.id);
  }

  async onEliminar(notif: NotificacionAdmin): Promise<void> {
    await this.state.eliminar(notif.id);
  }

  async marcarTodasLeidas(): Promise<void> {
    await this.state.marcarTodasLeidas();
  }

  async eliminarLeidas(): Promise<void> {
    await this.state.eliminarLeidas();
  }
}
