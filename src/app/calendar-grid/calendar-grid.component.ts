import {
  Component,
  input,
  output,
  signal,
  computed,
  effect,
  viewChild,
  ElementRef,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Turno, STATUS } from '../types';

interface LayoutItem {
  turno: Turno;
  col: number;
  totalCols: number;
}

@Component({
  selector: 'app-calendar-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar-grid.component.html',
  styleUrl: './calendar-grid.component.css',
})
export class CalendarGridComponent implements OnInit, OnDestroy {
  // Inputs
  selectedDate = input.required<Date>();
  viewMode = input.required<'day' | 'week'>();
  turns = input.required<Turno[]>();

  // Outputs
  selectedDateChange = output<Date>();
  viewModeChange = output<'day' | 'week'>();
  turnoClick = output<number>();
  turnoMoved = output<{ id: number; newStart: string; newEnd: string }>();

  // ViewChildren
  calContainer = viewChild<ElementRef<HTMLDivElement>>('calContainer');
  gridArea = viewChild<ElementRef<HTMLDivElement>>('gridArea');
  dropIndicator = viewChild<ElementRef<HTMLDivElement>>('dropIndicator');

  // Constants
  readonly START_HOUR = 7;
  readonly END_HOUR = 21;
  readonly TOTAL_HOURS = this.END_HOUR - this.START_HOUR;
  /** Altura en px de cada hora en la grilla (más alto = turnos menos apretados). */
  readonly HOUR_H = 96;
  readonly PX_PER_MIN = this.HOUR_H / 60;
  readonly SNAP_MIN = 15;

  // Signals for state
  hourLabels = signal<string[]>([]);
  hourLines = signal<{ top: number; half?: boolean }[]>([]);
  weekDates = signal<Date[]>([]);
  dayLayout = signal<LayoutItem[]>([]);
  weekLayout = signal<Map<string, LayoutItem[]>>(new Map());
  nowTop = signal<number | null>(null);
  tooltipVisible = signal(false);
  tooltipData = signal<{ patient: string; time: string; doctor: string; type: string; status: string } | null>(null);
  tooltipX = signal(0);
  tooltipY = signal(0);
  draggingId = signal<number | null>(null);

  private nowInterval: any;

  // Status colors
  statusMap = STATUS;

  getStatusColor(key: string): string {
    const colors: Record<string, string> = {
      pendiente: '#9e8530',
      confirmado: '#3d7a54',
      pagado: '#3b6e90',
      cancelado: '#8c4444',
      atendido: '#605090'
    };
    return colors[key] || 'var(--c-800)';
  }

  getStatusColorStyle(key: string): { color: string } {
    return { color: this.getStatusColor(key) };
  }

  // Computed for derived state
  isDayView = computed(() => this.viewMode() === 'day');
  
  // Expose Math for template
  Math = Math;

  // Effects
  constructor() {
    effect(() => {
      this.recalc();
    });
  }

  // Utilities
  fmtDate(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  parseTime(t: string): number {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  }

  minsToTime(m: number): string {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  }

  timeToY(t: string): number {
    return (this.parseTime(t) - this.START_HOUR * 60) * this.PX_PER_MIN;
  }

  yToTime(y: number): string {
    const mins =
      Math.round((y / this.PX_PER_MIN / this.SNAP_MIN) * this.SNAP_MIN) +
      this.START_HOUR * 60;
    return this.minsToTime(
      Math.max(this.START_HOUR * 60, Math.min(this.END_HOUR * 60, mins))
    );
  }

  getDur(s: string, e: string): number {
    return this.parseTime(e) - this.parseTime(s);
  }

  isToday(d: Date): boolean {
    const now = new Date();
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  }

  getWeekDates(d: Date): Date[] {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(d);
    mon.setDate(diff);
    return Array.from({ length: 7 }, (_, i) => {
      const x = new Date(mon);
      x.setDate(mon.getDate() + i);
      return x;
    });
  }

  dateLabel(d: Date): string {
    return d.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
    });
  }

  dateSub(d: Date): string {
    return d.toLocaleDateString('es-AR', {
      month: 'long',
      year: 'numeric',
    });
  }

  weekLabel(): string {
    const wk = this.getWeekDates(this.selectedDate());
    const start = wk[0].toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
    const end = wk[6].toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
    const year = wk[6].getFullYear();
    return `${start} – ${end}<span class="dd-sub">${year}</span>`;
  }

  dateShort(d: Date): string {
    return d
      .toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' })
      .replace('.', '');
  }

  // Layout algorithm
  computeLayout(turnList: Turno[]): LayoutItem[] {
    if (!turnList.length) return [];

    const sorted = [...turnList].sort((a, b) => {
      const d = this.parseTime(a.startTime) - this.parseTime(b.startTime);
      return d !== 0 ? d : this.getDur(b.startTime, b.endTime) - this.getDur(a.startTime, a.endTime);
    });

    const endTimes: number[] = [];
    const result: LayoutItem[] = [];

    for (const turno of sorted) {
      const start = this.parseTime(turno.startTime);
      let col = -1;
      for (let i = 0; i < endTimes.length; i++) {
        if (endTimes[i] <= start) {
          col = i;
          break;
        }
      }
      if (col === -1) {
        col = endTimes.length;
        endTimes.push(0);
      }
      endTimes[col] = this.parseTime(turno.endTime);
      result.push({ turno, col, totalCols: 1 });
    }

    const groups: LayoutItem[][] = [];
    let group: LayoutItem[] = [result[0]];

    for (let i = 1; i < result.length; i++) {
      const overlaps = group.some(
        (r) => this.parseTime(r.turno.endTime) > this.parseTime(result[i].turno.startTime)
      );
      if (overlaps) {
        group.push(result[i]);
      } else {
        groups.push(group);
        group = [result[i]];
      }
    }
    groups.push(group);

    groups.forEach((g) => {
      const mx = Math.max(...g.map((r) => r.col)) + 1;
      g.forEach((r) => {
        r.totalCols = mx;
      });
    });

    return result;
  }

  // Build static structures
  buildHours() {
    const labels: string[] = [];
    const lines: { top: number; half?: boolean }[] = [];
    for (let h = this.START_HOUR; h < this.END_HOUR; h++) {
      labels.push(`${String(h).padStart(2, '0')}:00`);
      lines.push({ top: (h - this.START_HOUR) * this.HOUR_H });
      if (h < this.END_HOUR - 1) {
        lines.push({
          top: (h - this.START_HOUR) * this.HOUR_H + this.HOUR_H / 2,
          half: true,
        });
      }
    }
    lines.push({ top: (this.END_HOUR - this.START_HOUR) * this.HOUR_H });
    this.hourLabels.set(labels);
    this.hourLines.set(lines);
  }

  updateNowLine() {
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    if (
      this.isDayView() &&
      this.isToday(this.selectedDate()) &&
      nowMins >= this.START_HOUR * 60 &&
      nowMins <= this.END_HOUR * 60
    ) {
      this.nowTop.set((nowMins - this.START_HOUR * 60) * this.PX_PER_MIN);
    } else {
      this.nowTop.set(null);
    }
  }

  // Calculate layouts
  recalc() {
    if (this.isDayView()) {
      const dateStr = this.fmtDate(this.selectedDate());
      const dayTurns = this.turns().filter((t) => t.date === dateStr);
      this.dayLayout.set(this.computeLayout(dayTurns));
    } else {
      this.weekDates.set(this.getWeekDates(this.selectedDate()));
      const layout = new Map<string, LayoutItem[]>();
      this.weekDates().forEach((d) => {
        const ds = this.fmtDate(d);
        const dayTurns = this.turns().filter((t) => t.date === ds);
        layout.set(ds, this.computeLayout(dayTurns));
      });
      this.weekLayout.set(layout);
    }
    this.updateNowLine();
  }

  // Navigation
  prevDay() {
    const d = new Date(this.selectedDate());
    d.setDate(d.getDate() - 1);
    this.selectedDateChange.emit(d);
  }

  nextDay() {
    const d = new Date(this.selectedDate());
    d.setDate(d.getDate() + 1);
    this.selectedDateChange.emit(d);
  }

  goToday() {
    this.selectedDateChange.emit(new Date());
  }

  setView(mode: 'day' | 'week') {
    this.viewModeChange.emit(mode);
  }

  // Tooltip
  onBlockMouseEnter(event: MouseEvent, turno: Turno) {
    const st = this.statusMap[turno.status];
    this.tooltipData.set({
      patient: turno.patient,
      time: `${turno.startTime} – ${turno.endTime}`,
      doctor: turno.doctor,
      type: turno.type,
      status: st.label,
    });
    this.tooltipVisible.set(true);
    this.positionTooltip(event);
  }

  onBlockMouseMove(event: MouseEvent) {
    if (this.tooltipVisible()) this.positionTooltip(event);
  }

  onBlockMouseLeave() {
    this.tooltipVisible.set(false);
    this.tooltipData.set(null);
  }

  positionTooltip(event: MouseEvent) {
    this.tooltipX.set(event.clientX + 10);
    this.tooltipY.set(event.clientY + 10);
    requestAnimationFrame(() => {
      const tip = document.getElementById('cal-tooltip');
      if (tip) {
        const r = tip.getBoundingClientRect();
        if (r.right > window.innerWidth) this.tooltipX.set(event.clientX - r.width - 6);
        if (r.bottom > window.innerHeight) this.tooltipY.set(event.clientY - r.height - 6);
      }
    });
  }

  // Drag & Drop
  onDragStart(event: DragEvent, turno: Turno) {
    if (!event.dataTransfer) return;
    event.dataTransfer.setData('text/plain', String(turno.id));
    event.dataTransfer.effectAllowed = 'move';
    this.draggingId.set(turno.id);
  }

  onDragEnd() {
    this.draggingId.set(null);
    const di = this.dropIndicator();
    if (di?.nativeElement) {
      di.nativeElement.style.display = 'none';
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    if (!event.dataTransfer) return;
    event.dataTransfer.dropEffect = 'move';

    const ga = this.gridArea()?.nativeElement;
    const container = this.calContainer()?.nativeElement;
    const di = this.dropIndicator()?.nativeElement;
    if (!ga || !container || !di) return;

    const rect = ga.getBoundingClientRect();
    const y = event.clientY - rect.top + container.scrollTop;
    const snapped =
      Math.round((y / this.PX_PER_MIN / this.SNAP_MIN) * this.SNAP_MIN) * this.PX_PER_MIN;
    di.style.display = 'block';
    di.style.top = Math.max(0, snapped) + 'px';
  }

  onDragLeave(event: DragEvent) {
    const ga = this.gridArea()?.nativeElement;
    if (ga && !ga.contains(event.relatedTarget as Node)) {
      const di = this.dropIndicator()?.nativeElement;
      if (di) di.style.display = 'none';
    }
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const di = this.dropIndicator()?.nativeElement;
    if (di) di.style.display = 'none';

    if (!event.dataTransfer) return;
    const turnoId = parseInt(event.dataTransfer.getData('text/plain'), 10);
    if (isNaN(turnoId)) return;

    const ga = this.gridArea()?.nativeElement;
    const container = this.calContainer()?.nativeElement;
    if (!ga || !container) return;

    const rect = ga.getBoundingClientRect();
    const y = event.clientY - rect.top + container.scrollTop;
    const newStart = this.yToTime(y);

    const turno = this.turns().find((t) => t.id === turnoId);
    if (turno) {
      const dur = this.getDur(turno.startTime, turno.endTime);
      const newEnd = this.minsToTime(this.parseTime(newStart) + dur);
      this.turnoMoved.emit({ id: turnoId, newStart, newEnd });
    }

    this.draggingId.set(null);
  }

  // Scroll to now
  scrollToNow() {
    requestAnimationFrame(() => {
      const el = this.calContainer()?.nativeElement;
      if (!el) return;
      if (this.isToday(this.selectedDate())) {
        const now = new Date();
        const y = (now.getHours() * 60 + now.getMinutes() - this.START_HOUR * 60) * this.PX_PER_MIN;
        el.scrollTop = Math.max(0, y - 100);
      } else {
        el.scrollTop = this.HOUR_H;
      }
    });
  }

  // Lifecycle
  ngOnInit() {
    this.buildHours();
    this.nowInterval = setInterval(() => this.updateNowLine(), 60000);
  }

  ngOnDestroy() {
    if (this.nowInterval) clearInterval(this.nowInterval);
  }
}