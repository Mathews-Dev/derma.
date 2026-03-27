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
      class="group relative w-[60px] h-[60px] flex items-center justify-center rounded-full bg-[var(--c-50)] text-[var(--c-800)] border border-[var(--c-800)] overflow-hidden transition-transform duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed">

      <div class="relative z-10 flex items-center justify-center">
        @if (isLoading()) {
          <svg class="animate-spin h-[20px] w-[20px] text-[var(--c-800)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        } @else {
          <span class="tracking-widest text-[10px] font-semibold group-hover:text-[var(--c-50)] transition-colors duration-300">
            {{ label() }}
          </span>
        }
      </div>

      <div class="absolute inset-0 z-0 flex items-center justify-center bg-[var(--c-800)] text-[var(--c-50)] rounded-full transition-all duration-300 ease-out scale-0 group-hover:scale-100">
         @if (!isLoading()) {
          <span class="tracking-widest text-[10px] font-semibold">
            {{ label() }}
          </span>
         }
      </div>
    </button>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiButtonComponent {
  label = input<string>('');
  type = input<string>('button');
  disabled = input<boolean>(false);
  isLoading = input<boolean>(false);
}

