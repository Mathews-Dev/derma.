import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ui-accordion',
  standalone: true,
  template: `
    <div class="min-h-0 bg-transparent">
      <ng-content></ng-content>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccordionComponent {}
