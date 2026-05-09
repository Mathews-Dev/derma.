import { ChangeDetectionStrategy, Component, HostListener, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Turno } from '@derma/models';

@Component({
  selector: 'derm-turno-cancelar-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './turno-cancelar-modal.component.html',
  styleUrl: './turno-cancelar-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
// Force IDE cache refresh
export class TurnoCancelarModalComponent {
  turno = input.required<Turno>();
  confirm = output<{ motivo: string; conReembolso: boolean }>();
  close   = output<void>();

  motivo        = signal('');
  conReembolso  = signal(false);
  loading       = signal(false);

  @HostListener('document:keydown.escape') onEsc() { this.close.emit(); }

  get canConfirm() { return this.motivo().trim().length >= 5; }

  onConfirm() {
    if (!this.canConfirm) return;
    this.confirm.emit({ motivo: this.motivo(), conReembolso: this.conReembolso() });
  }
}
