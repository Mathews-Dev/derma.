/**
 * Appointment state enum - values persisted in Firestore
 * Keep aligned with EstadoTurno in @derma/models
 */
export enum EstadoTurno {
  PENDIENTE = 'pendiente',
  CONFIRMADO = 'confirmado',
  REPROGRAMADO = 'reprogramado',
  CANCELADO = 'cancelado',
  COMPLETADO = 'completado',
  ATENDIDO = 'atendido',
  NO_ASISTIO = 'no_asistio',
}

/**
 * Consultation modality type
 */
export type ModalidadConsulta = 'presencial' | 'videoconsulta';
