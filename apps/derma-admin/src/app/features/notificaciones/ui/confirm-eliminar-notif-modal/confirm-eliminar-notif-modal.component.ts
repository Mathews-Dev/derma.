import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';

@Component({
  selector: 'app-confirm-eliminar-notif-modal',
  standalone: true,
  templateUrl: './confirm-eliminar-notif-modal.component.html',
  styleUrl: './confirm-eliminar-notif-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmEliminarNotifModalComponent {
  confirmed = output<void>();
  cancelled = output<void>();

  isClosing = signal(false);

  triggerConfirm(): void {
    if (this.isClosing()) return;
    this.isClosing.set(true);
    setTimeout(() => this.confirmed.emit(), 400);
  }

  triggerCancel(): void {
    if (this.isClosing()) return;
    this.isClosing.set(true);
    setTimeout(() => this.cancelled.emit(), 400);
  }
}
