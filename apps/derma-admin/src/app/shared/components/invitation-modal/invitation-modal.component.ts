import { ChangeDetectionStrategy, Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvitacionService } from '@derma/firebase';
import { RolUsuario } from '@derma/models';
import { UiDropdownSelectComponent, SelectOption, TooltipComponent } from '@derma/ui';

@Component({
  selector: 'derma-admin-invitation-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, UiDropdownSelectComponent, TooltipComponent],
  templateUrl: './invitation-modal.component.html',
  styleUrl: './invitation-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvitationModalComponent {
  @Output() closeEvent = new EventEmitter<void>();

  private invitacionService = inject(InvitacionService);

  uiRoles: SelectOption[] = [
    { id: RolUsuario.ADMIN, label: 'Admin' },
    { id: RolUsuario.DERMATOLOGO, label: 'Dermatólogo' },
    { id: RolUsuario.RECEPCIONISTA, label: 'Recepcionista' },
    { id: RolUsuario.EMPLEADO, label: 'Empleado' }
  ];

  selectedRole = signal<RolUsuario>(RolUsuario.DERMATOLOGO);
  generatedLink = signal<string>('');
  isGenerating = signal<boolean>(false);
  isCopied = signal<boolean>(false);
  isClosing = signal<boolean>(false);

  triggerClose(): void {
    if (this.isClosing()) return;
    this.isClosing.set(true);
    setTimeout(() => {
      this.closeEvent.emit();
    }, 400); // Wait for out animation
  }

  onRoleChange(option: SelectOption): void {
    this.selectedRole.set(option.id as RolUsuario);
  }

  async generateLink(): Promise<void> {
    this.isGenerating.set(true);
    try {
      // Clear previous link
      this.generatedLink.set('');
      
      const link = await this.invitacionService.generarInvitacion(this.selectedRole());
      this.generatedLink.set(link);
    } catch (error) {
      console.error('Error generando invitación:', error);
    } finally {
      this.isGenerating.set(false);
    }
  }

  copyLink(): void {
    const link = this.generatedLink();
    if (!link) return;
    
    navigator.clipboard.writeText(link).then(() => {
      this.isCopied.set(true);
      setTimeout(() => this.isCopied.set(false), 2000);
    });
  }
}
