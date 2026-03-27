import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-datepicker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './datepicker.component.html',
  styleUrl: './datepicker.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DatepickerComponent {
  readonly selectedDate = input<Date | null>(null);
  readonly disabled = input(false);
  readonly label = input<string>('');
  readonly dateChange = output<Date>();

  protected readonly isOpen = signal(false);
  protected readonly currentDate = signal(new Date());
  
  protected readonly selectedDateValue = computed(() => {
    const date = this.selectedDate();
    return date ? this.formatDate(date) : '';
  });

  protected readonly daysInMonth = computed(() => {
    const date = this.currentDate();
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  });

  protected readonly firstDayOfMonth = computed(() => {
    const date = this.currentDate();
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  });

  protected readonly monthYear = computed(() => {
    const date = this.currentDate();
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  });

  protected readonly calendarDays = computed(() => {
    const daysInMonth = this.daysInMonth();
    const firstDay = this.firstDayOfMonth();
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  });

  protected toggleOpen() {
    if (!this.disabled()) {
      this.isOpen.update(val => !val);
    }
  }

  protected previousMonth() {
    this.currentDate.update(date => {
      const newDate = new Date(date);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  }

  protected nextMonth() {
    this.currentDate.update(date => {
      const newDate = new Date(date);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  }

  protected selectDay(day: number) {
    const newDate = new Date(this.currentDate().getFullYear(), this.currentDate().getMonth(), day);
    this.dateChange.emit(newDate);
    this.isOpen.set(false);
  }

  protected isSelected(day: number | null): boolean {
    if (!day) return false;
    const selected = this.selectedDate();
    if (!selected) return false;
    return day === selected.getDate() &&
           this.currentDate().getMonth() === selected.getMonth() &&
           this.currentDate().getFullYear() === selected.getFullYear();
  }

  private formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
}
