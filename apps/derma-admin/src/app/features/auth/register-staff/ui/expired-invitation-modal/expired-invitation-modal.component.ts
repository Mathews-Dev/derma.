import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'derma-admin-expired-invitation-modal',
  standalone: true,
  templateUrl: './expired-invitation-modal.component.html',
  styleUrl: './expired-invitation-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpiredInvitationModalComponent {
  @Output() continueAction = new EventEmitter<void>();

  onContinue() {
    this.continueAction.emit();
  }
}
