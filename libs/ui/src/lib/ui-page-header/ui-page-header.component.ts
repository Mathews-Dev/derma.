import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-page-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-start gap-3">
      <!-- Patrón decorativo izquierdo -->
      <div class="shrink-0 w-10 h-[56px] overflow-hidden opacity-[0.12] -mt-1">
        <svg width="40" height="56" viewBox="0 0 40 56" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.2" fill="var(--c-800)"/>
            </pattern>
            <mask id="fade">
              <linearGradient id="fadeGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="white" stop-opacity="0"/>
                <stop offset="55%" stop-color="white" stop-opacity="0.6"/>
                <stop offset="100%" stop-color="white" stop-opacity="1"/>
              </linearGradient>
              <rect width="40" height="56" fill="url(#fadeGrad)"/>
            </mask>
          </defs>
          <rect width="40" height="56" fill="url(#dots)" mask="url(#fade)"/>
        </svg>
      </div>

      <div class="flex flex-col gap-1.5 flex-1 min-w-0 -ml-7">
        <h1 class="text-[22px] font-medium text-[var(--c-900)] tracking-tight leading-tight">
          {{ title() }}
        </h1>
        <p class="text-[13px] text-[var(--c-500)] max-w-lg leading-relaxed">
          {{ description() }}
        </p>
      </div>
    </div>
  `,
})
export class UiPageHeaderComponent {
  title = input.required<string>();
  description = input.required<string>();
}
