import { calcularMomentoRecordatorio } from './reminder-schedule.service';
import {
  limpiarRecordatorioProgramado,
  programarRecordatorioTurno,
} from './appointment.service';
import type { TurnoParaProgramarRecordatorio } from '../models/appointment.model';

/**
 * Schedules a reminder for a confirmed appointment
 * This is the same logic used by the Firestore trigger
 */
export async function programarRecordatorioDesdeTurno(
  turno: TurnoParaProgramarRecordatorio,
): Promise<void> {
  if (!turno.notificacionesWhatsApp) return;
  if (turno.recordatorioWhatsAppEnviadoAt) return;

  const momento = calcularMomentoRecordatorio({
    fecha:              turno.fecha,
    horaInicio:         turno.horaInicio,
    modalidadConsulta:  turno.modalidadConsulta,
  });

  if (!momento) {
    await limpiarRecordatorioProgramado(turno.id);
    return;
  }

  await programarRecordatorioTurno(turno.id, momento);
}
