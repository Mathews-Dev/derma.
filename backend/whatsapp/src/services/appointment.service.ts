import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { EstadoTurno } from '../models/appointment.types';
import type { TurnoParaNotificar } from '../models/appointment.model';

/**
 * Get appointment data for notifications by ID
 */
export async function getTurnoParaNotificar(
  turnoId: string,
): Promise<TurnoParaNotificar | null> {
  const snap = await getFirestore().collection('turnos').doc(turnoId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() } as TurnoParaNotificar;
}

/**
 * Get appointments with scheduled reminders that are due to be sent
 */
export async function getTurnosRecordatorioPendientes(
  limit = 50,
): Promise<TurnoParaNotificar[]> {
  const now = Timestamp.now();
  const snap = await getFirestore()
    .collection('turnos')
    .where('recordatorioProgramadoPara', '<=', now)
    .limit(limit)
    .get();

  return snap.docs
    .map(doc => ({ id: doc.id, ...doc.data() }) as TurnoParaNotificar)
    .filter(
      t =>
        t.estado === EstadoTurno.CONFIRMADO &&
        t.notificacionesWhatsApp === true &&
        t.recordatorioWhatsAppEnviadoAt == null &&
        t.recordatorioProgramadoPara != null,
    );
}

/**
 * Schedule a reminder for a specific appointment
 */
export async function programarRecordatorioTurno(
  turnoId: string,
  cuando: Date,
): Promise<void> {
  await getFirestore().collection('turnos').doc(turnoId).update({
    recordatorioProgramadoPara: Timestamp.fromDate(cuando),
    fechaModificacion:          FieldValue.serverTimestamp(),
  });
}

/**
 * Clear the scheduled reminder for an appointment
 */
export async function limpiarRecordatorioProgramado(turnoId: string): Promise<void> {
  await getFirestore().collection('turnos').doc(turnoId).update({
    recordatorioProgramadoPara: null,
    fechaModificacion:          FieldValue.serverTimestamp(),
  });
}

/**
 * Mark that a WhatsApp reminder has been sent for an appointment
 */
export async function marcarRecordatorioWhatsAppEnviado(turnoId: string): Promise<void> {
  await getFirestore().collection('turnos').doc(turnoId).update({
    recordatorioWhatsAppEnviadoAt: FieldValue.serverTimestamp(),
    recordatorioProgramadoPara:    null,
    fechaModificacion:             FieldValue.serverTimestamp(),
  });
}
