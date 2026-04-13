import {
  Component, ChangeDetectionStrategy, input, output, signal, computed,
  inject, ViewChild, ElementRef, TemplateRef, ViewContainerRef, ChangeDetectorRef, OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Overlay, OverlayRef, OverlayConfig, ConnectedPosition } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';

@Component({
  selector: 'app-datepicker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './datepicker.component.html',
  styleUrl: './datepicker.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DatepickerComponent implements OnDestroy {
  @ViewChild('triggerButton') triggerButton!: ElementRef;
  @ViewChild('calendarPanel') calendarPanel!: TemplateRef<unknown>;

  private overlay = inject(Overlay);
  private viewContainerRef = inject(ViewContainerRef);
  private cdr = inject(ChangeDetectorRef);

  readonly selectedDate = input<Date | null>(null);
  readonly disabled = input(false);
  readonly label = input<string>('');
  readonly dateChange = output<Date>();

  protected readonly isOpen = signal(false);
  private overlayRef: OverlayRef | null = null;

  protected readonly view = signal<'days' | 'months' | 'years'>('days');
  protected readonly currentDate = signal(new Date());
  protected readonly yearRangeStart = signal(new Date().getFullYear() - 5);

  protected readonly MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  protected readonly yearRange = computed(() =>
    Array.from({ length: 12 }, (_, i) => this.yearRangeStart() + i)
  );

  protected readonly currentMonth = computed(() => this.currentDate().getMonth());
  protected readonly currentYear  = computed(() => this.currentDate().getFullYear());

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
      if (this.isOpen()) {
        this.closeCalendar();
      } else {
        this.openCalendar();
      }
    }
  }

  ngOnDestroy() {
    this.closeCalendar();
  }

  private openCalendar() {
    if (!this.triggerButton || !this.calendarPanel) return;

    const positions: ConnectedPosition[] = [
      { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 8 },
      { originX: 'start', originY: 'top',    overlayX: 'start', overlayY: 'bottom', offsetY: -8 }
    ];

    const config = new OverlayConfig({
      positionStrategy: this.overlay
        .position()
        .flexibleConnectedTo(this.triggerButton)
        .withPositions(positions),
      hasBackdrop: true,
      backdropClass: '',
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      width: Math.max(this.triggerButton.nativeElement.offsetWidth, 280)
    });

    this.overlayRef = this.overlay.create(config);
    const portal = new TemplatePortal(this.calendarPanel, this.viewContainerRef);
    this.overlayRef.attach(portal);
    this.isOpen.set(true);

    this.overlayRef.backdropClick().subscribe(() => this.closeCalendar());
    this.cdr.markForCheck();
  }

  private closeCalendar() {
    if (this.overlayRef) {
      this.overlayRef.detach();
      this.overlayRef = null;
    }
    this.isOpen.set(false);
    this.view.set('days');
    this.cdr.markForCheck();
  }

  protected previousMonth() {
    this.currentDate.update(d => { const n = new Date(d); n.setMonth(n.getMonth() - 1); return n; });
  }

  protected nextMonth() {
    this.currentDate.update(d => { const n = new Date(d); n.setMonth(n.getMonth() + 1); return n; });
  }

  protected previousYear() {
    this.currentDate.update(d => { const n = new Date(d); n.setFullYear(n.getFullYear() - 1); return n; });
  }

  protected nextYear() {
    this.currentDate.update(d => { const n = new Date(d); n.setFullYear(n.getFullYear() + 1); return n; });
  }

  protected previousRange() { this.yearRangeStart.update(y => y - 12); }
  protected nextRange()     { this.yearRangeStart.update(y => y + 12); }

  protected openMonthPicker() { this.view.set('months'); }

  protected openYearPicker() {
    this.yearRangeStart.set(this.currentDate().getFullYear() - 5);
    this.view.set('years');
  }

  protected setMonth(month: number) {
    this.currentDate.update(d => { const n = new Date(d); n.setMonth(month); return n; });
    this.view.set('days');
  }

  protected setYear(year: number) {
    this.currentDate.update(d => { const n = new Date(d); n.setFullYear(year); return n; });
    this.view.set('months');
  }

  protected selectDay(day: number) {
    const newDate = new Date(this.currentDate().getFullYear(), this.currentDate().getMonth(), day);
    this.dateChange.emit(newDate);
    this.closeCalendar();
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
