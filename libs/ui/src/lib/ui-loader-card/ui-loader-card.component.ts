import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-loader-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center justify-center h-80 rounded-[24px] border border-dashed border-[var(--c-200)] bg-[var(--c-50)]/40">
      <div class="relative size-10">
        <div class="absolute inset-0 rounded-full border border-[var(--c-200)]"></div>
        <div class="absolute inset-0 rounded-full border border-[var(--c-800)] border-t-transparent animate-spin"></div>
      </div>
      <span class="mt-4 text-[10px] font-medium text-[var(--c-500)] uppercase tracking-widest animate-pulse">
        {{ message() }}
      </span>
    </div>
  `,
})
export class UiLoaderCardComponent {
  message = input<string>('Cargando Datos');
}
