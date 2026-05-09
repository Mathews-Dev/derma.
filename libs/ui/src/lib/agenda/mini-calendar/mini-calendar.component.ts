import { ChangeDetectionStrategy, Component, input, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';

interface DayCell {
  id: string; // Stable ID for tracking (YYYY-MM-DD)
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  hasTurns: boolean;
}

@Component({
  selector: 'ui-mini-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mini-calendar.component.html',
  styleUrl: './mini-calendar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MiniCalendarComponent {
  selectedDate = input.required<Date>();
  viewMonth = signal<Date>(new Date());
  datesWithTurns = input<string[]>([]); // ISO format strings
  
  onDateSelect = output<Date>();

  protected readonly view = signal<'days' | 'months' | 'years'>('days');
  protected readonly yearRangeStart = signal(new Date().getFullYear() - 5);

  protected readonly monthsNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  protected readonly currentMonthLabel = computed(() => this.monthsNames[this.viewMonth().getMonth()]);
  protected readonly currentYearLabel = computed(() => this.viewMonth().getFullYear());

  protected readonly currentMonth = computed(() => this.viewMonth().getMonth());
  protected readonly currentYear  = computed(() => this.viewMonth().getFullYear());

  protected readonly yearRange = computed(() =>
    Array.from({ length: 12 }, (_, i) => this.yearRangeStart() + i)
  );

  protected readonly calendarDays = computed(() => {
    const year = this.viewMonth().getFullYear();
    const month = this.viewMonth().getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    
    const cells: DayCell[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Prev month
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDays - i);
      cells.push(this.createCell(d, false, today));
    }

    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      cells.push(this.createCell(d, true, today));
    }

    // Next month
    const totalCells = cells.length;
    const remaining = (7 - (totalCells % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      cells.push(this.createCell(d, false, today));
    }

    return cells;
  });

  private createCell(date: Date, isCurrentMonth: boolean, today: Date): DayCell {
    const selDate = this.selectedDate();
    const localId = this.formatLocalISO(date);

    return {
      id: localId,
      date,
      dayNumber: date.getDate(),
      isCurrentMonth,
      isToday: this.isSameDay(date, today),
      isSelected: this.isSameDay(date, selDate),
      hasTurns: this.datesWithTurns().includes(localId)
    };
  }

  private isSameDay(d1: Date | null, d2: Date | null): boolean {
    if (!d1 || !d2) return false;
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  private formatLocalISO(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  nextMonth() {
    const d = new Date(this.viewMonth());
    d.setMonth(d.getMonth() + 1);
    this.viewMonth.set(d);
  }

  prevMonth() {
    const d = new Date(this.viewMonth());
    d.setMonth(d.getMonth() - 1);
    this.viewMonth.set(d);
  }

  protected previousYear() {
    this.viewMonth.update(d => { const n = new Date(d); n.setFullYear(n.getFullYear() - 1); return n; });
  }

  protected nextYear() {
    this.viewMonth.update(d => { const n = new Date(d); n.setFullYear(n.getFullYear() + 1); return n; });
  }

  protected previousRange() { this.yearRangeStart.update(y => y - 12); }
  protected nextRange()     { this.yearRangeStart.update(y => y + 12); }

  protected openMonthPicker() { this.view.set('months'); }

  protected openYearPicker() {
    this.yearRangeStart.set(this.viewMonth().getFullYear() - 5);
    this.view.set('years');
  }

  protected setMonth(month: number) {
    this.viewMonth.update(d => { const n = new Date(d); n.setMonth(month); return n; });
    this.view.set('days');
  }

  protected setYear(year: number) {
    this.viewMonth.update(d => { const n = new Date(d); n.setFullYear(year); return n; });
    this.view.set('months');
  }

  selectDate(cell: DayCell) {
    this.onDateSelect.emit(cell.date);
  }
}
