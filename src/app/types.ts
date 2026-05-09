export interface Turno {
  id: number;
  date: string;          // YYYY-MM-DD
  startTime: string;     // HH:mm
  endTime: string;       // HH:mm
  patient: string;
  dni: string;
  phone: string;
  email: string;
  doctor: string;
  type: string;
  status: 'pendiente' | 'confirmado' | 'pagado' | 'cancelado' | 'atendido';
  payMethod: string;
  payAmount: number;
  payStatus: 'pendiente' | 'pagado';
  notes: string;
  duration: number;
}

export const STATUS = {
  pendiente:  { label: 'Pendiente',  color: 'var(--st-pend)',  bg: 'var(--st-pend-bg)' },
  confirmado: { label: 'Confirmado', color: 'var(--st-conf)',  bg: 'var(--st-conf-bg)' },
  pagado:     { label: 'Pagado',     color: 'var(--st-paid)',  bg: 'var(--st-paid-bg)' },
  cancelado:  { label: 'Cancelado',  color: 'var(--st-canc)',  bg: 'var(--st-canc-bg)' },
  atendido:   { label: 'Atendido',  color: 'var(--st-aten)',  bg: 'var(--st-aten-bg)' }
};

export const DOCTORS = ['Dra. López', 'Dr. Martínez', 'Dra. Ramírez'];

/** Filtros de agenda: `doctors` vacío = todos los profesionales. */
export interface AgendaFilters {
  doctors: string[];
  status: string;
  type: string;
}

export function defaultAgendaFilters(): AgendaFilters {
  return { doctors: [], status: 'todos', type: 'todos' };
}
export const TYPES = ['Consulta General', 'Control', 'Procedimiento', 'Láser', 'Biopsia', 'Chequeo'];
export const PAYMENTS = ['Efectivo', 'Tarjeta', 'Transferencia', 'Pendiente'];