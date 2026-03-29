import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type UiBadgeStatus = 'neutral' | 'success' | 'danger' | 'warning';

@Component({
  selector: 'ui-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-bold uppercase tracking-widest"
          [class]="badgeClasses()">
      <span class="size-1.5 rounded-full" [class]="dotClasses()"></span>
      <ng-content></ng-content>
    </span>
  `,
})
export class UiBadgeComponent {
  status = input<UiBadgeStatus>('neutral');

  badgeClasses = computed(() => {
    switch (this.status()) {
      case 'success':
        return 'bg-emerald-50/50 border-emerald-100 text-emerald-700';
      case 'danger':
        return 'bg-red-50/50 border-red-100 text-red-700';
      case 'warning':
        return 'bg-amber-50/50 border-amber-100 text-amber-700';
      default:
        return 'bg-[var(--c-200)] border-[var(--c-300)] text-[var(--c-600)]';
    }
  });

  dotClasses = computed(() => {
    switch (this.status()) {
      case 'success':
        return 'bg-emerald-500';
      case 'danger':
        return 'bg-red-500';
      case 'warning':
        return 'bg-amber-500';
      default:
        return 'bg-[var(--c-500)]';
    }
  });
}
