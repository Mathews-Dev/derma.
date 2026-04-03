import {
  ChangeDetectionStrategy,
  Component,
  computed,
  model,
  signal,
} from '@angular/core';

@Component({
  selector: 'ui-time-picker',
  standalone: true,
  imports: [],
  templateUrl: './ui-time-picker.component.html',
  styleUrl: './ui-time-picker.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiTimePickerComponent {
  /** Two-way binding: "HH:MM" 24h format */
  value = model<string>('09:00');

  readonly hours = computed(() => {
    const parts = this.value().split(':');
    return Math.min(23, Math.max(0, parseInt(parts[0]) || 0));
  });

  readonly minutes = computed(() => {
    const parts = this.value().split(':');
    return Math.min(59, Math.max(0, parseInt(parts[1]) || 0));
  });

  readonly displayHours = computed(() =>
    String(this.hours()).padStart(2, '0')
  );

  readonly displayMinutes = computed(() =>
    String(this.minutes()).padStart(2, '0')
  );

  // Editing state for direct keyboard input
  editingHours   = signal(false);
  editingMinutes = signal(false);
  rawHours       = signal('');
  rawMinutes     = signal('');

  private emit(h: number, m: number): void {
    const clamped = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    this.value.set(clamped);
  }

  incrementHours(): void {
    this.emit((this.hours() + 1) % 24, this.minutes());
  }

  decrementHours(): void {
    this.emit((this.hours() + 23) % 24, this.minutes());
  }

  incrementMinutes(): void {
    const newMin = this.minutes() + 15;
    if (newMin >= 60) {
      this.emit((this.hours() + 1) % 24, newMin % 60);
    } else {
      this.emit(this.hours(), newMin);
    }
  }

  decrementMinutes(): void {
    const newMin = this.minutes() - 15;
    if (newMin < 0) {
      this.emit((this.hours() + 23) % 24, (newMin + 60) % 60);
    } else {
      this.emit(this.hours(), newMin);
    }
  }

  onHoursFocus(): void {
    this.editingHours.set(true);
    this.rawHours.set(this.displayHours());
  }

  onMinutesFocus(): void {
    this.editingMinutes.set(true);
    this.rawMinutes.set(this.displayMinutes());
  }

  onHoursInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 2);
    this.rawHours.set(val);
  }

  onMinutesInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 2);
    this.rawMinutes.set(val);
  }

  onHoursBlur(): void {
    this.editingHours.set(false);
    const h = Math.min(23, Math.max(0, parseInt(this.rawHours()) || 0));
    this.emit(h, this.minutes());
  }

  onMinutesBlur(): void {
    this.editingMinutes.set(false);
    const raw = parseInt(this.rawMinutes()) || 0;
    const m = Math.min(59, Math.max(0, raw));
    this.emit(this.hours(), m);
  }

  onHoursKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp')   { event.preventDefault(); this.incrementHours(); }
    if (event.key === 'ArrowDown') { event.preventDefault(); this.decrementHours(); }
    if (event.key === 'Enter' || event.key === 'Tab') { this.onHoursBlur(); }
  }

  onMinutesKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp')   { event.preventDefault(); this.incrementMinutes(); }
    if (event.key === 'ArrowDown') { event.preventDefault(); this.decrementMinutes(); }
    if (event.key === 'Enter' || event.key === 'Tab') { this.onMinutesBlur(); }
  }
}
