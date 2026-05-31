import {
  getTurnoParaNotificar,
  getTurnosRecordatorioPendientes,
  marcarRecordatorioWhatsAppEnviado,
} from './appointment.service';
import { sendTemplate } from '../providers/whatsapp/whatsapp.service';
import { formatPhoneAR } from '../utils/phone.utils';
import { plantillaRecordatorioParaTurno } from '../utils/reminder-appointment.utils';
import { EstadoTurno } from '../models/appointment.types';
import type { TurnoParaNotificar } from '../models/appointment.model';

async function enviarRecordatorioTurno(turno: TurnoParaNotificar): Promise<void> {
  const rawPhone = turno.telefonoNotificaciones ?? turno.pacienteTelefono ?? '';

  if (!rawPhone) {
    console.warn(`[Recordatorios] Turno ${turno.id} sin teléfono, saltando`);
    return;
  }

  if (turno.estado !== EstadoTurno.CONFIRMADO) {
    console.warn(`[Recordatorios] Turno ${turno.id} no confirmado, saltando`);
    return;
  }

  const armado = plantillaRecordatorioParaTurno(turno);
  if ('error' in armado) {
    if (armado.error === 'sin_access_token') {
      console.warn(
        `[Recordatorios] Turno ${turno.id} sin accessToken ni Meet válido, saltando`,
      );
    }
    return;
  }

  if (
    turno.modalidadConsulta === 'videoconsulta' &&
    armado.tipo === 'turno'
  ) {
    console.warn(
      `[Recordatorios] Turno ${turno.id} videoconsulta sin link Meet; enviando derma_turno_recordatorio`,
    );
  }

  const telefono = formatPhoneAR(rawPhone);
  await sendTemplate(telefono, armado.template);
  await marcarRecordatorioWhatsAppEnviado(turno.id);

  console.log(
    `[Recordatorios] Sent (${armado.tipo === 'videoconsulta' ? 'derma_videoconsulta_recordatorio' : 'derma_turno_recordatorio'}) → ${turno.pacienteNombre} (turno ${turno.id})`,
  );
}

/**
 * Cron job: sends reminders for appointments whose scheduled time has passed
 */
export async function procesarRecordatoriosPendientes(): Promise<void> {
  const turnos = await getTurnosRecordatorioPendientes();
  console.log(`[Recordatorios] ${turnos.length} pending appointment(s) to send`);

  if (turnos.length === 0) return;

  const resultados = await Promise.allSettled(
    turnos.map(turno => enviarRecordatorioTurno(turno)),
  );

  const fallidos = resultados.filter(r => r.status === 'rejected');
  fallidos.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.error(`[Recordatorios] Error ${i + 1}:`, r.reason);
    }
  });

  console.log(
    `[Recordatorios] Completed: ${resultados.length - fallidos.length} ok, ${fallidos.length} failed`,
  );
}

/**
 * Manually send a reminder for a specific appointment (for HTTP calls or testing)
 */
export async function enviarRecordatorioPorTurnoId(turnoId: string): Promise<void> {
  const turno = await getTurnoParaNotificar(turnoId);
  if (!turno) {
    throw new Error(`Turno no encontrado: ${turnoId}`);
  }
  if (turno.recordatorioWhatsAppEnviadoAt) {
    console.log(`[Recordatorios] Turno ${turnoId} reminder already sent`);
    return;
  }
  await enviarRecordatorioTurno(turno);
}
