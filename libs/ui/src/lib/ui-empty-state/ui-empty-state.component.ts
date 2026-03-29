import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center opacity-50">
      <div class="size-12 rounded-full border border-[var(--c-200)] bg-[var(--c-50)] flex items-center justify-center mb-3">
        <svg class="size-5 text-[var(--c-500)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
        </svg>
      </div>
      <p class="text-[11px] font-medium uppercase tracking-widest text-[var(--c-500)]">
        {{ message() }}
      </p>
    </div>
  `,
})
export class UiEmptyStateComponent {
  message = input<string>('Sin datos');
}
