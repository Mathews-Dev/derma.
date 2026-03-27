import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectWithSearchComponent, SelectOption } from '../select-with-search/select-with-search.component';
import { DropdownActionsComponent, ActionType } from '../dropdown-actions/dropdown-actions.component';

@Component({
  selector: 'app-select-dropdown-demo',
  standalone: true,
  imports: [CommonModule, SelectWithSearchComponent, DropdownActionsComponent],
  template: `
    <div class="w-full max-w-md mx-auto p-8 bg-[var(--c-50)]">
      <div class="space-y-6">
        <!-- Select with Search Example -->
        <div>
          <label class="block text-[10px] tracking-[0.18em] uppercase text-[var(--c-400)] mb-3">
            Selecciona un usuario
          </label>
          <app-select-with-search
            [options]="users()"
            [selectedValue]="selectedUserId()"
            (valueChanged)="onUserSelected($event)"
            placeholder="Buscar usuario..." />
          
          @if (selectedUserId()) {
            <p class="mt-2 text-[0.875rem] text-[var(--c-600)]">
              Usuario seleccionado: <strong>{{ getSelectedUserLabel() }}</strong>
            </p>
          }
        </div>

        <!-- Dropdown Actions Example -->
        <div>
          <label class="block text-[10px] tracking-[0.18em] uppercase text-[var(--c-400)] mb-3">
            Acciones
          </label>
          <div class="flex items-center gap-4">
            <span class="text-[0.875rem] text-[var(--c-800)]">{{ getSelectedUserLabel() || 'Usuario' }}</span>
            <app-dropdown-actions (actionClicked)="onActionClicked($event)" />
          </div>
          
          @if (lastAction()) {
            <p class="mt-2 text-[0.875rem] text-[var(--c-600)]">
              Última acción: <strong>{{ lastAction() }}</strong>
            </p>
          }
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectDropdownDemoComponent {
  users = signal<SelectOption[]>([
    { id: 1, label: 'Juan García' },
    { id: 2, label: 'María López' },
    { id: 3, label: 'Carlos Rodríguez' },
    { id: 4, label: 'Ana Martínez' },
    { id: 5, label: 'Pedro Sánchez' },
  ]);

  selectedUserId = signal<string | number | null>(null);
  lastAction = signal<string | null>(null);

  onUserSelected(option: SelectOption) {
    this.selectedUserId.set(option.id);
    this.lastAction.set(null);
  }

  onActionClicked(action: ActionType) {
    const actionLabels: Record<ActionType, string> = {
      edit: '✏️ Editar',
      delete: '🗑️ Eliminar',
      archive: '📦 Archivar'
    };
    this.lastAction.set(actionLabels[action]);
  }

  getSelectedUserLabel(): string {
    const userId = this.selectedUserId();
    if (userId === null) return '';
    const user = this.users().find(u => u.id === userId);
    return user?.label || '';
  }
}
