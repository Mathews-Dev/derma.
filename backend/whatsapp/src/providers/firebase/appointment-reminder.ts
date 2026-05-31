import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { EstadoTurno } from '../../models/appointment.types';
import { programarRecordatorioDesdeTurno } from '../../services/recordatorio-programar.service';
import { limpiarRecordatorioProgramado } from '../../services/appointment.service';
import type { Timestamp } from 'firebase-admin/firestore';

type TurnoDoc = {
  estado?: string;
  notificacionesWhatsApp?: boolean;
  recordatorioWhatsAppEnviadoAt?: unknown;
  fecha?: { toDate: () => Date };
  horaInicio?: string;
  modalidadConsulta?: 'presencial' | 'videoconsulta' | null;
};

/**
 * Firestore trigger: schedules or clears reminders when appointments are confirmed or canceled
 */
export const onTurnoConfirmado = onDocumentWritten(
  {
    document: 'turnos/{turnoId}',
    region:  'southamerica-east1',
  },
  async event => {
    const turnoId = event.params.turnoId;
    const afterSnap = event.data?.after;
    if (!afterSnap?.exists) return;

    const after = afterSnap.data() as TurnoDoc | undefined;
    const before = event.data?.before?.data() as TurnoDoc | undefined;
    if (!after) return;

    if (
      after.estado === EstadoTurno.CANCELADO &&
      before?.estado !== EstadoTurno.CANCELADO
    ) {
      await limpiarRecordatorioProgramado(turnoId);
      return;
    }

    const becameConfirmed =
      after.estado === EstadoTurno.CONFIRMADO &&
      before?.estado !== EstadoTurno.CONFIRMADO;

    if (!becameConfirmed) return;
    if (!after.fecha || !after.horaInicio) return;

    await programarRecordatorioDesdeTurno({
      id: turnoId,
      fecha: afterSnap.get('fecha') as Timestamp,
      horaInicio: after.horaInicio,
      notificacionesWhatsApp: !!after.notificacionesWhatsApp,
      recordatorioWhatsAppEnviadoAt: after.recordatorioWhatsAppEnviadoAt as Timestamp | null | undefined,
      modalidadConsulta: after.modalidadConsulta,
    });

    console.log(`[AppointmentReminder] Turno ${turnoId} reminder scheduling evaluated`);
  },
);
