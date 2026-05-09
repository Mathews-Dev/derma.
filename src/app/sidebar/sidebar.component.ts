import { Component, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { DOCTORS, TYPES, STATUS, AgendaFilters, defaultAgendaFilters } from '../types';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  dateSelect = output<string>();
  filterChange = output<AgendaFilters>();
  searchChange = output<string>();
  newTurn = output<void>();

  calMonth = signal(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  selectedDate = signal(new Date());
  filters = signal<AgendaFilters>(defaultAgendaFilters());
  search = signal('');
  filtersOpen = signal(false);

  get daysOfWeek() { return ['L', 'M', 'M', 'J', 'V', 'S', 'D']; }

  get statusEntries() {
    return Object.entries(STATUS);
  }

  get typesList() {
    return TYPES;
  }

  get doctorsList() {
    return DOCTORS;
  }

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
    return date.getDate() === this.selectedDate().getDate() &&
           date.getMonth() === this.selectedDate().getMonth() &&
           date.getFullYear() === this.selectedDate().getFullYear();
  }

  fmtDate(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  prevMonth() {
    const cm = this.calMonth();
    this.calMonth.set(new Date(cm.getFullYear(), cm.getMonth() - 1, 1));
  }

  nextMonth() {
    const cm = this.calMonth();
    this.calMonth.set(new Date(cm.getFullYear(), cm.getMonth() + 1, 1));
  }

  selectDate(date: Date) {
    this.selectedDate.set(date);
    this.dateSelect.emit(this.fmtDate(date));
  }

  private emitFilters(next: AgendaFilters) {
    const f: AgendaFilters = {
      doctors: [...next.doctors],
      status: next.status,
      type: next.type,
    };
    this.filters.set(f);
    this.filterChange.emit(f);
  }

  isDoctorSelected(name: string): boolean {
    return this.filters().doctors.includes(name);
  }

  toggleDoctor(name: string) {
    const cur = [...this.filters().doctors];
    const i = cur.indexOf(name);
    if (i >= 0) {
      cur.splice(i, 1);
    } else {
      cur.push(name);
    }
    this.emitFilters({ ...this.filters(), doctors: cur });
  }

  removeDoctor(name: string) {
    this.emitFilters({
      ...this.filters(),
      doctors: this.filters().doctors.filter((d) => d !== name),
    });
  }

  onDoctorsChange(selected: string[]) {
    this.emitFilters({
      ...this.filters(),
      doctors: selected || [],
    });
  }

  compareDoctors(a: string, b: string): boolean {
    return a === b;
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }

  onFilterChange(key: 'status' | 'type', value: string) {
    this.emitFilters({ ...this.filters(), [key]: value });
  }

  clearFilter(key: 'status' | 'type') {
    this.emitFilters({ ...this.filters(), [key]: 'todos' });
  }

  statusLabel(key: string): string {
    return STATUS[key as keyof typeof STATUS]?.label ?? key;
  }

  onSearchInput(value: string) {
    this.search.set(value);
    this.searchChange.emit(value);
  }
}
