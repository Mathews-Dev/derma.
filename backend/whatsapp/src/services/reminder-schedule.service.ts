import { DateTime } from 'luxon';
import { WHATSAPP_TZ } from '../utils/date.utils';
import type { TurnoParaCalcularRecordatorio } from '../models/appointment.model';

/**
 * Calculates when to send the reminder (using Luxon with Argentina timezone)
 *
 * For VIDEOCONSULTAS:
 * - 1 hour before the appointment
 *
 * For PRESENCIAL appointments:
 * - More than 24h remaining: 24h before the appointment
 * - Between 4h and 24h remaining: 2h before (with 8 AM minimum)
 * - Less than 4h remaining: No reminder
 *
 * Always requires at least 1h between reminder and appointment
 */
export function calcularMomentoRecordatorio(
  turno: TurnoParaCalcularRecordatorio,
  ahora: DateTime = DateTime.now().setZone(WHATSAPP_TZ),
): Date | null {
  const fechaTurno = fechaHoraTurnoEnTz(turno);
  const horasRestantes = fechaTurno.diff(ahora, 'hours').hours;
  const limiteMinimoEnvio = fechaTurno.minus({ hours: 1 });

  if (turno.modalidadConsulta === 'videoconsulta') {
    const momento1hAntes = fechaTurno.minus({ hours: 1 });

    if (ahora < momento1hAntes) {
      return momento1hAntes.toJSDate();
    }
    return null;
  }

  let momento: DateTime | null = null;

  if (horasRestantes >= 24) {
    momento = fechaTurno.minus({ hours: 24 });
  } else if (horasRestantes > 4) {
    momento = fechaTurno.minus({ hours: 2 });

    const minimo8AM = fechaTurno.startOf('day').set({ hour: 8 });
    if (momento < minimo8AM) {
      momento = minimo8AM;
    }

    if (momento >= limiteMinimoEnvio) {
      return null;
    }
  } else {
    return null;
  }

  return momento.toJSDate();
}

function fechaHoraTurnoEnTz(turno: TurnoParaCalcularRecordatorio): DateTime {
  const fd = turno.fecha.toDate();
  const ymd = new Intl.DateTimeFormat('en-CA', {
    timeZone:     WHATSAPP_TZ,
    year:         'numeric',
    month:        '2-digit',
    day:          '2-digit',
  }).format(fd);
  const [y, m, d] = ymd.split('-').map(Number);
  const [hRaw, mRaw = '0'] = turno.horaInicio.trim().split(':');
  const hour = Math.min(23, Math.max(0, parseInt(hRaw, 10)));
  const minute = Math.min(59, Math.max(0, parseInt(mRaw, 10)));

  return DateTime.fromObject(
    { year: y, month: m, day: d, hour, minute },
    { zone: WHATSAPP_TZ },
  );
}
