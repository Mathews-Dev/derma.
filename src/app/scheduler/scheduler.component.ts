import { Component, signal, computed } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { CalendarGridComponent } from '../calendar-grid/calendar-grid.component';
import { AgendaListComponent } from '../agenda-list/agenda-list.component';
import { Turno, DOCTORS, TYPES, PAYMENTS, AgendaFilters, defaultAgendaFilters } from '../types';

@Component({
  selector: 'app-scheduler',
  standalone: true,
  imports: [SidebarComponent, CalendarGridComponent, AgendaListComponent],
  templateUrl: './scheduler.component.html',
  styleUrl: './scheduler.component.css'
})
export class SchedulerComponent {
  selectedDate = signal(new Date());
  viewMode = signal<'day' | 'week'>('day');
  filters = signal<AgendaFilters>(defaultAgendaFilters());
  search = signal('');

  turns = signal<Turno[]>(this.makeTurns());
  nextId = signal(100);

  get filteredTurns() {
    const dateStr = this.fmtDate(this.selectedDate());
    const f = this.filters();
    const q = this.search().toLowerCase();
    
    return this.turns().filter(t => {
      // Filter by date
      if (this.viewMode() === 'day' && t.date !== dateStr) return false;
      if (this.viewMode() === 'week') {
        const wk = this.getWeekDates(this.selectedDate());
        if (!wk.some(w => this.fmtDate(w) === t.date)) return false;
      }
      if (f.doctors.length > 0 && !f.doctors.includes(t.doctor)) return false;
      // Filter by status
      if (f.status !== 'todos' && t.status !== f.status) return false;
      // Filter by type
      if (f.type !== 'todos' && t.type !== f.type) return false;
      // Filter by search
      if (q && !t.patient.toLowerCase().includes(q) && !t.dni.includes(q) && !t.phone.includes(q)) return false;
      return true;
    });
  }

  get dayTurns() {
    const dateStr = this.fmtDate(this.selectedDate());
    const f = this.filters();
    const q = this.search().toLowerCase();
    
    return this.turns()
      .filter(t => {
        if (t.date !== dateStr) return false;
        if (f.doctors.length > 0 && !f.doctors.includes(t.doctor)) return false;
        if (f.status !== 'todos' && t.status !== f.status) return false;
        if (f.type !== 'todos' && t.type !== f.type) return false;
        if (q && !t.patient.toLowerCase().includes(q) && !t.dni.includes(q) && !t.phone.includes(q)) return false;
        return true;
      })
      .sort((a, b) => this.parseTime(a.startTime) - this.parseTime(b.startTime));
  }

  makeTurns(): Turno[] {
    const today = new Date();
    const d = this.fmtDate(today);
    return [
      { id: 1, date: d, startTime: '08:00', endTime: '08:30', patient: 'María González Pérez', dni: '32.456.789', phone: '11 5678-1234', email: 'maria.g@email.com', doctor: 'Dra. López', type: 'Consulta General', status: 'confirmado' as const, payMethod: 'Efectivo', payAmount: 15000, payStatus: 'pendiente' as const, notes: 'Primera consulta. Dermatitis atópica.', duration: 30 },
      { id: 2, date: d, startTime: '08:30', endTime: '09:00', patient: 'Carlos Rodríguez', dni: '28.123.456', phone: '11 4321-8765', email: 'carlos.r@email.com', doctor: 'Dra. López', type: 'Control', status: 'atendido' as const, payMethod: 'Tarjeta', payAmount: 10000, payStatus: 'pagado' as const, notes: 'Control post-tratamiento acné.', duration: 30 },
      { id: 3, date: d, startTime: '09:00', endTime: '09:30', patient: 'Ana Martínez', dni: '35.789.012', phone: '11 9876-5432', email: 'ana.m@email.com', doctor: 'Dra. López', type: 'Procedimiento', status: 'pendiente' as const, payMethod: 'Pendiente', payAmount: 35000, payStatus: 'pendiente' as const, notes: 'Criocirugía lesión precancerosa.', duration: 30 },
      { id: 4, date: d, startTime: '09:00', endTime: '09:45', patient: 'Lucía Fernández', dni: '40.234.567', phone: '11 6543-2109', email: 'lucia.f@email.com', doctor: 'Dr. Martínez', type: 'Láser', status: 'confirmado' as const, payMethod: 'Transferencia', payAmount: 45000, payStatus: 'pendiente' as const, notes: 'Láser CO2 cicatrices acneicas.', duration: 45 },
      { id: 5, date: d, startTime: '09:15', endTime: '09:45', patient: 'Roberto Sánchez', dni: '25.678.901', phone: '11 3456-7890', email: 'roberto.s@email.com', doctor: 'Dra. Ramírez', type: 'Consulta General', status: 'pagado' as const, payMethod: 'Tarjeta', payAmount: 15000, payStatus: 'pagado' as const, notes: 'Manchas en dorso.', duration: 30 },
      { id: 6, date: d, startTime: '10:00', endTime: '10:30', patient: 'Valentina Torres', dni: '38.901.234', phone: '11 7890-1234', email: 'valentina.t@email.com', doctor: 'Dra. López', type: 'Biopsia', status: 'cancelado' as const, payMethod: 'Pendiente', payAmount: 25000, payStatus: 'pendiente' as const, notes: 'Biopsia lunar sospechoso.', duration: 30 },
      { id: 7, date: d, startTime: '10:30', endTime: '11:00', patient: 'Diego Álvarez', dni: '33.012.345', phone: '11 2345-6789', email: 'diego.a@email.com', doctor: 'Dr. Martínez', type: 'Control', status: 'confirmado' as const, payMethod: 'Efectivo', payAmount: 10000, payStatus: 'pendiente' as const, notes: 'Control trimestral psoriasis.', duration: 30 },
      { id: 8, date: d, startTime: '11:00', endTime: '11:30', patient: 'Sofía Herrera', dni: '41.345.678', phone: '11 8765-4321', email: 'sofia.h@email.com', doctor: 'Dra. Ramírez', type: 'Láser', status: 'pendiente' as const, payMethod: 'Pendiente', payAmount: 45000, payStatus: 'pendiente' as const, notes: 'Depilación láser axilar.', duration: 30 },
      { id: 9, date: d, startTime: '11:15', endTime: '11:45', patient: 'Matías Gómez', dni: '29.678.901', phone: '11 5432-1098', email: 'matias.g@email.com', doctor: 'Dra. López', type: 'Consulta General', status: 'atendido' as const, payMethod: 'Efectivo', payAmount: 15000, payStatus: 'pagado' as const, notes: 'Urticaria crónica.', duration: 30 },
      { id: 10, date: d, startTime: '12:00', endTime: '12:30', patient: 'Camila Ruiz', dni: '36.890.123', phone: '11 6789-0123', email: 'camila.r@email.com', doctor: 'Dr. Martínez', type: 'Chequeo', status: 'pagado' as const, payMethod: 'Tarjeta', payAmount: 20000, payStatus: 'pagado' as const, notes: 'Chequeo dermatológico anual.', duration: 30 },
    ];
  }

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

  onDateSelect(dateStr: string) {
    this.selectedDate.set(new Date(dateStr + 'T12:00:00'));
  }

  onFilterChange(f: AgendaFilters) {
    this.filters.set({
      doctors: [...f.doctors],
      status: f.status,
      type: f.type,
    });
  }

  onSearchChange(q: string) {
    this.search.set(q);
  }

  onViewChange(m: 'day' | 'week') {
    this.viewMode.set(m);
  }

  onTurnoClick(id: number) {
    console.log('Turno clicked:', id);
  }

  onTurnoMoved(e: { id: number; newStart: string; newEnd: string }) {
    const updated = this.turns().map(t =>
      t.id === e.id ? { ...t, startTime: e.newStart, endTime: e.newEnd } : t
    );
    this.turns.set(updated);
  }

  onQuickAction(e: { id: number; status: string }) {
    const updated = this.turns().map(t =>
      t.id === e.id ? { ...t, status: e.status as any, payStatus: e.status === 'pagado' ? 'pagado' : t.payStatus } : t
    );
    this.turns.set(updated);
  }

  onNewTurn() {
    console.log('New turn clicked');
  }
}