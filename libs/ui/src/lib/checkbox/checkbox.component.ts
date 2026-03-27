import { Component, ChangeDetectionStrategy, input, output, signal, effect } from '@angular/core';

@Component({
  selector: 'app-checkbox',
  standalone: true,
  templateUrl: './checkbox.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckboxComponent {
  readonly checked  = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly label    = input<string>('');

  readonly checkedChange = output<boolean>();

  // Estado interno — se sincroniza con el input pero permite toggle local
  protected state = signal(false);

  constructor() {
    effect(() => {
      this.state.set(this.checked());
    });
  }

  protected toggle() {
    if (this.disabled()) return;
    const next = !this.state();
    this.state.set(next);
    this.checkedChange.emit(next);
  }
}