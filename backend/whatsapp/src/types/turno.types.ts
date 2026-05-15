/**
 * Valores persistidos en Firestore; mantener alineado con `EstadoTurno` en `@derma/models`.
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
