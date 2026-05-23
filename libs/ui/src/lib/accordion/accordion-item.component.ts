import { Component, input, model, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-accordion-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="accordion-item border-b border-[var(--c-200)] last:border-b-0">
      <button
        type="button"
        class="group flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-[rgba(173,181,189,0.04)]"
        [attr.aria-expanded]="isOpen()"
        (click)="toggle()">
        
        <div class="flex items-center gap-2 flex-1 min-w-0">
          <span class="text-[11px] font-bold uppercase tracking-wider text-[var(--c-400)]">
            {{ title() }}
          </span>
          <ng-content select="[header-extra]"></ng-content>
        </div>

        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="2.5"
          stroke="currentColor"
          class="size-3 flex-shrink-0 text-[var(--c-400)] transition-transform duration-300"
          [class.rotate-180]="isOpen()">
          <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      <div
        class="accordion-panel grid min-h-0 transition-[grid-template-rows] duration-300 ease-out"
        [style.grid-template-rows]="isOpen() ? 'minmax(0, 1fr)' : '0fr'">
        <div class="min-h-0 overflow-hidden min-w-0">
          <div class="accordion-content">
            <ng-content></ng-content>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class UiAccordionItemComponent {
  title = input.required<string>();
  isOpen = model(false);
  opened = output<boolean>();

  toggle() {
    this.isOpen.update(v => !v);
    this.opened.emit(this.isOpen());
  }
}
