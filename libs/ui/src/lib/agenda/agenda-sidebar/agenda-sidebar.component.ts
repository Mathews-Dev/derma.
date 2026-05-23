import { Component, signal, output, input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { STATUS, TIPO_TURNO_OPTIONS, AgendaFilters, defaultAgendaFilters } from '../types';
import { SelectWithSearchComponent, SelectOption } from '../../select-with-search/select-with-search.component';
import { TooltipComponent } from '../../tooltip/tooltip.component';
import { UiDropdownSelectComponent } from '../../dropdown-select/dropdown-select';
import { AccordionComponent } from '../../accordion/accordion.component';
import { UiAccordionItemComponent } from '../../accordion/accordion-item.component';

/** Datos mínimos de un profesional para el sidebar. */
export interface ProfesionalSidebar {
  id: string;
  nombre: string;
  apellido: string;
  color?: string;
}

@Component({
  selector: 'ui-agenda-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SelectWithSearchComponent,
    UiDropdownSelectComponent,
    AccordionComponent,
    UiAccordionItemComponent,
    TooltipComponent,
  ],
  templateUrl: './agenda-sidebar.component.html',
  styleUrl: './agenda-sidebar.component.css'
})
export class AgendaSidebarComponent {
  // ─── Outputs ──────────────────────────────────────────────────────────────
  dateSelect   = output<string>();
  filterChange = output<AgendaFilters>();
  searchChange = output<string>();
  newTurn      = output<void>();
  /** Mes visible en el mini-calendario (para cargar turnos del rango). */
  monthChange  = output<{ year: number; month: number }>();

  /**
   * Lista de profesionales que proviene del feature (cargados desde Firebase).
   * Reemplaza el array DOCTORS hardcodeado anterior.
   */
  profesionales = input<ProfesionalSidebar[]>([]);

  /** Fecha activa (sincronizada con la agenda principal). */
  selectedDate = input.required<Date>();

  /** Claves YYYY-MM-DD de días con al menos un turno (según filtros del padre). */
  datesWithTurns = input<string[]>([]);

  // ─── State ────────────────────────────────────────────────────────────────
  calMonth    = signal(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  filters     = signal<AgendaFilters>(defaultAgendaFilters());
  search      = signal('');

  constructor() {
    effect(() => {
      const sel = this.selectedDate();
      const cm = this.calMonth();
      if (
        sel.getFullYear() !== cm.getFullYear() ||
        sel.getMonth() !== cm.getMonth()
      ) {
        const next = new Date(sel.getFullYear(), sel.getMonth(), 1);
        this.calMonth.set(next);
        this.monthChange.emit({ year: next.getFullYear(), month: next.getMonth() });
      }
    });
  }

  // ─── Calendar ─────────────────────────────────────────────────────────────
  get daysOfWeek() { return ['L', 'M', 'M', 'J', 'V', 'S', 'D']; }

  get calendarDays() {
    const cm = this.calMonth();
    const y = cm.getFullYear();
    const m = cm.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const off = firstDay === 0 ? 6 : firstDay - 1;
    const daysInM = new Date(y, m + 1, 0).getDate();
    const prevD = new Date(y, m, 0).getDate();

    const days: { date: Date; day: number; isOther: boolean }[] = [];

    for (let i = off - 1; i >= 0; i--) {
      days.push({ date: new Date(y, m - 1, prevD - i), day: prevD - i, isOther: true });
    }
    for (let d = 1; d <= daysInM; d++) {
      days.push({ date: new Date(y, m, d), day: d, isOther: false });
    }
    const total = off + daysInM;
    const rem = (7 - (total % 7)) % 7;
    for (let d = 1; d <= rem; d++) {
      days.push({ date: new Date(y, m + 1, d), day: d, isOther: true });
    }
    return days;
  }

  get monthName() {
    return this.calMonth().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  isSelected(date: Date): boolean {
    const sel = this.selectedDate();
    return (
      date.getDate() === sel.getDate() &&
      date.getMonth() === sel.getMonth() &&
      date.getFullYear() === sel.getFullYear()
    );
  }

  hasTurns(date: Date): boolean {
    return this.datesWithTurns().includes(this.fmtDateLocal(date));
  }

  fmtDateLocal(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private emitMonthChange(month: Date): void {
    this.monthChange.emit({ year: month.getFullYear(), month: month.getMonth() });
  }

  prevMonth() {
    const cm = this.calMonth();
    const next = new Date(cm.getFullYear(), cm.getMonth() - 1, 1);
    this.calMonth.set(next);
    this.emitMonthChange(next);
  }

  nextMonth() {
    const cm = this.calMonth();
    const next = new Date(cm.getFullYear(), cm.getMonth() + 1, 1);
    this.calMonth.set(next);
    this.emitMonthChange(next);
  }

  selectDate(date: Date) {
    this.dateSelect.emit(this.fmtDateLocal(date));
  }

  // ─── Filtros ──────────────────────────────────────────────────────────────

  get statusOptions(): SelectOption[] {
    return [
      { id: 'todos', label: 'Todos los estados' },
      ...Object.entries(STATUS).map(([id, s]) => ({ id, label: s.label }))
    ];
  }

  get typeOptions(): SelectOption[] {
    return TIPO_TURNO_OPTIONS.map(t => ({ id: t.id, label: t.label }));
  }

  /** Convierte los profesionales recibidos en SelectOptions para el buscador. */
  get profesionalesAsOptions(): SelectOption[] {
    return this.profesionales().map(p => ({
      id: p.id,
      label: `${p.nombre} ${p.apellido}`,
    }));
  }

  /** Nombre completo de un profesional por ID. */
  getNombreProfesional(id: string): string {
    const p = this.profesionales().find(p => p.id === id);
    return p ? `${p.nombre} ${p.apellido}` : id;
  }

  /** Iniciales del profesional por ID. */
  getInitialesProfesional(id: string): string {
    const nombre = this.getNombreProfesional(id);
    return nombre.split(' ').map(w => w.charAt(0).toUpperCase()).slice(0, 2).join('');
  }

  /** Color del profesional (fallback a hash del ID). */
  getColorProfesional(id: string): string {
    const p = this.profesionales().find(p => p.id === id);
    if (p?.color) return p.color;
    // Paleta simple determinista
    const palette = ['#4285F4','#0F9D58','#F4B400','#DB4437','#9C27B0','#00897B','#E91E63','#FF5722','#3949AB'];
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return palette[Math.abs(hash) % palette.length];
  }

  private emitFilters(next: AgendaFilters) {
    const f: AgendaFilters = {
      profesionalesIds: [...next.profesionalesIds],
      status: next.status,
      type: next.type,
    };
    this.filters.set(f);
    this.filterChange.emit(f);
  }

  isProfesionalSelected(id: string): boolean {
    return this.filters().profesionalesIds.includes(id);
  }

  onProfesionalSelect(option: SelectOption) {
    this.toggleProfesional(option.id as string);
  }

  toggleProfesional(id: string) {
    const cur = [...this.filters().profesionalesIds];
    const i = cur.indexOf(id);
    if (i >= 0) cur.splice(i, 1);
    else cur.push(id);
    this.emitFilters({ ...this.filters(), profesionalesIds: cur });
  }

  removeProfesional(id: string) {
    this.emitFilters({
      ...this.filters(),
      profesionalesIds: this.filters().profesionalesIds.filter(p => p !== id),
    });
  }

  onFilterChange(key: 'status' | 'type', value: string) {
    this.emitFilters({ ...this.filters(), [key]: value });
  }

  clearFilter(key: 'status' | 'type') {
    this.emitFilters({ ...this.filters(), [key]: 'todos' });
  }

  statusLabel(key: string): string {
    return STATUS[key]?.label ?? key;
  }

  onSearchInput(value: string) {
    this.search.set(value);
    this.searchChange.emit(value);
  }

  /** Número de filtros activos (para el badge del acordeón). */
  get activeFiltersCount(): number {
    return this.filters().profesionalesIds.length +
      (this.filters().status !== 'todos' ? 1 : 0) +
      (this.filters().type !== 'todos' ? 1 : 0);
  }
}
