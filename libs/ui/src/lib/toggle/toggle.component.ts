import { Component, ChangeDetectionStrategy, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toggle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toggle.component.html',
  styleUrl: './toggle.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToggleComponent {
  readonly isChecked = input(false);
  readonly disabled = input(false);
  readonly change = output<boolean>();

  protected readonly state = signal(this.isChecked());

  constructor() {
    effect(() => {
      this.state.set(this.isChecked());
    });
  }

  protected toggle() {
    if (!this.disabled()) {
      this.state.update(val => !val);
      this.change.emit(this.state());
    }
  }
}
