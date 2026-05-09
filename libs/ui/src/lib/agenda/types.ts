// ─── Re-export del modelo real ─────────────────────────────────────────────
// Los componentes de la agenda deben importar desde aquí (no de @derma/models directamente)
// para mantener una única fuente de configuración UI.
export type { Turno, SlotHorario, MpPagoData } from '@derma/models';
export { EstadoTurno, EstadoPago, MetodoPago, AccionTurno } from '@derma/models';

// ─── Mapeo de Estados para UI ─────────────────────────────────────────────

/** Configuración visual de cada estado de turno. */
export const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  [/** EstadoTurno.PENDIENTE  */ 'pendiente']:    { label: 'Pendiente',    color: 'var(--st-pend)', bg: 'var(--st-pend-bg)' },
  [/** EstadoTurno.CONFIRMADO */ 'confirmado']:   { label: 'Confirmado',   color: 'var(--st-conf)', bg: 'var(--st-conf-bg)' },
  [/** EstadoTurno.ATENDIDO   */ 'atendido']:     { label: 'Atendido',     color: 'var(--st-aten)', bg: 'var(--st-aten-bg)' },
  [/** EstadoTurno.CANCELADO  */ 'cancelado']:    { label: 'Cancelado',    color: 'var(--st-canc)', bg: 'var(--st-canc-bg)' },
  [/** EstadoTurno.NO_ASISTIO */ 'no_asistio']:   { label: 'No asistió',   color: 'var(--st-canc)', bg: 'var(--st-canc-bg)' },
  [/** EstadoTurno.REPROGRAMADO */ 'reprogramado']: { label: 'Reprogramado', color: 'var(--st-pend)', bg: 'var(--st-pend-bg)' },
  [/** EstadoTurno.COMPLETADO */ 'completado']:   { label: 'Completado',   color: 'var(--st-aten)', bg: 'var(--st-aten-bg)' },
};

/** Mapeo visual del estado de pago. */
export const PAGO_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  [/** EstadoPago.PENDIENTE   */ 'pendiente']:    { label: 'Pago pendiente', color: 'var(--st-pend)', bg: 'var(--st-pend-bg)' },
  [/** EstadoPago.PAGADO      */ 'pagado']:       { label: 'Pagado',         color: 'var(--st-conf)', bg: 'var(--st-conf-bg)' },
  [/** EstadoPago.PARCIAL     */ 'parcial']:      { label: 'Parcial',        color: '#a06020',        bg: 'rgba(160,96,32,0.08)' },
  [/** EstadoPago.REEMBOLSADO */ 'reembolsado']:  { label: 'Reembolsado',    color: 'var(--st-pend)', bg: 'var(--st-pend-bg)' },
  [/** EstadoPago.FALLIDO     */ 'fallido']:      { label: 'Fallido',        color: 'var(--st-canc)', bg: 'var(--st-canc-bg)' },
};

// ─── Colores de Profesionales (Google Calendar style) ─────────────────────

/**
 * Paleta de colores para profesionales.
 * Se asigna un color por posición (o via hash del ID) para distinguirlos
 * visualmente en la grilla de la agenda.
 */
export const PROFESIONAL_COLORS = [
  '#4285F4', // Google Blue
  '#0F9D58', // Google Green
  '#F4B400', // Google Yellow
  '#DB4437', // Google Red
  '#9C27B0', // Purple
  '#00897B', // Teal
  '#E91E63', // Pink
  '#FF5722', // Deep Orange
  '#3949AB', // Indigo
  '#00ACC1', // Cyan
];

/**
 * Genera un color determinista para un profesional basado en su ID.
 * Asegura que el mismo profesional siempre tenga el mismo color.
 */
export function getProfesionalColor(profesionalId: string): string {
  let hash = 0;
  for (let i = 0; i < profesionalId.length; i++) {
    hash = profesionalId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PROFESIONAL_COLORS.length;
  return PROFESIONAL_COLORS[index];
}

// ─── Tipos de turno ────────────────────────────────────────────────────────

export const TIPO_TURNO_OPTIONS = [
  { id: 'todos',       label: 'Todos los tipos' },
  { id: 'consulta',    label: 'Consulta' },
  { id: 'tratamiento', label: 'Tratamiento' },
];

// ─── Filtros de Agenda ─────────────────────────────────────────────────────

/** Filtros de la agenda. `profesionalesIds` vacío = todos los profesionales. */
export interface AgendaFilters {
  /** IDs de los profesionales seleccionados. Vacío = todos. */
  profesionalesIds: string[];
  /** Estado de turno a filtrar. 'todos' = sin filtro. */
  status: string;
  /** Tipo de turno a filtrar. 'todos' = sin filtro. */
  type: string;
}

export function defaultAgendaFilters(): AgendaFilters {
  return { profesionalesIds: [], status: 'todos', type: 'todos' };
}
