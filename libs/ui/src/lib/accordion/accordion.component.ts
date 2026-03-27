import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

export interface AccordionItem {
  id: string;
  title: string;
  content: string;
}

@Component({
  selector: 'app-accordion',
  templateUrl: './accordion.component.html',
  styleUrl: './accordion.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccordionComponent {
  readonly items = input<AccordionItem[]>([]);
  readonly allowMultiple = input(false);

  private readonly openedIds = signal<string[]>([]);

  protected isOpen(id: string): boolean {
    return this.openedIds().includes(id);
  }

  protected toggle(id: string): void {
    const current = this.openedIds();

    if (current.includes(id)) {
      this.openedIds.set(current.filter((openedId) => openedId !== id));
      return;
    }

    if (this.allowMultiple()) {
      this.openedIds.set([...current, id]);
      return;
    }

    this.openedIds.set([id]);
  }
}
