import { ChangeDetectionStrategy, Component, signal, effect, ElementRef, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CalendarGridComponent, 
  MiniCalendarComponent,
  UiPageHeaderComponent
} from '@derma/ui';

@Component({
  selector: 'derm-recepcionista-agenda',
  standalone: true,
  imports: [
    CommonModule,
    CalendarGridComponent,
    MiniCalendarComponent,
    UiPageHeaderComponent
  ],
  templateUrl: './recepcionista.component.html',
  styleUrl: './recepcionista.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecepcionistaPageComponent {
  selectedDate = signal<Date>(new Date());
  viewMode = signal<'day' | 'week'>('day');
  searchQuery = signal<string>('');
  
  // Mock data for initial design verification
  mockDatesWithTurns = signal<string[]>([]);

  constructor() {
    // Scroll to current time effect
    effect(() => {
      // Trigger scroll logic when page loads or date changes
      this.scrollToNow();
    });
  }

  onPrevDate() {
    const d = new Date(this.selectedDate());
    if (this.viewMode() === 'day') {
      d.setDate(d.getDate() - 1);
    } else {
      d.setDate(d.getDate() - 7);
    }
    this.selectedDate.set(d);
  }

  onNextDate() {
    const d = new Date(this.selectedDate());
    if (this.viewMode() === 'day') {
      d.setDate(d.getDate() + 1);
    } else {
      d.setDate(d.getDate() + 7);
    }
    this.selectedDate.set(d);
  }

  onToday() {
    this.selectedDate.set(new Date());
  }

  onDateSelected(date: Date) {
    this.selectedDate.set(date);
  }

  onViewChanged(mode: 'day' | 'week') {
    this.viewMode.set(mode);
  }

  private scrollToNow() {
    setTimeout(() => {
      const container = document.querySelector('.cal-container');
      const nowLine = document.querySelector('.now-line');
      if (container && nowLine) {
        const top = (nowLine as HTMLElement).offsetTop;
        container.scrollTo({ top: top - 100, behavior: 'smooth' });
      }
    }, 100);
  }
}
