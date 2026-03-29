import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button 
      [type]="type()" 
      [disabled]="disabled() || isLoading()"
      [ngClass]="[size() || 'py-3.5', buttonClass() || 'w-full sm:w-auto']"
      class="group relative inline-flex items-center justify-center min-w-[160px] px-8 rounded bg-[var(--c-800)] text-[var(--c-50)] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[4px_4px_0px_var(--c-300)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none active:translate-y-0 active:shadow-none">

      <div class="relative z-10 flex items-center justify-center gap-2">
        <span class="tracking-[0.15em] text-[0.7rem] font-semibold uppercase">
          {{ label() }}
        </span>
      </div>
    </button>
  `,
  styles: `
    :host {
      display: block;
    }

    @keyframes buttonPress {
      0% {
        transform: scale(1);
      }
      50% {
        transform: scale(0.98);
      }
      100% {
        transform: scale(1);
      }
    }

    button:active {
      animation: buttonPress 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiButtonComponent {
  label = input<string>('');
  type = input<string>('button');
  disabled = input<boolean>(false);
  isLoading = input<boolean>(false);
  size = input<string>(''); // Ej: 'h-[44px] py-2' para altura y padding personalizado
  buttonClass = input<string>(''); // Clases Tailwind adicionales: 'w-auto', 'w-full', etc.
}

