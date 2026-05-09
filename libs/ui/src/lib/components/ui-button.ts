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
      [ngClass]="[size() || 'h-[44px]', buttonClass() || 'px-6']"
      class="group relative inline-flex items-center justify-center rounded-lg bg-[var(--c-800)] text-[var(--c-50)] overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-0 active:shadow-sm border border-[var(--c-800)]">

      <div class="relative z-10 flex items-center justify-center gap-2 px-2">
        @if (isLoading()) {
          <svg class="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        }
        <span class="tracking-widest text-[0.7rem] font-bold uppercase whitespace-nowrap">
          {{ label() }}
        </span>
      </div>
      
      <!-- Efecto de brillo sutil en hover -->
      <div class="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
    </button>
  `,
  styles: `
    :host {
      display: inline-block;
      vertical-align: middle;
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
  label = input.required<string>();
  type = input<string>('button');
  disabled = input<boolean>(false);
  isLoading = input<boolean>(false);
  size = input<string>(''); // Ej: 'h-[44px] py-2' para altura y padding personalizado
  buttonClass = input<string>(''); // Clases Tailwind adicionales: 'w-auto', 'w-full', etc.
}

