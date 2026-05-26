import type { TemplateMessage } from '../templates/types';
import { templates } from '../templates';
import { extractMeetCode } from '../utils/meet.utils';
import {
  formatSoloFechaHumanaWhatsApp,
  formatSoloHoraDesdeString,
} from '../utils/date.utils';
import type { TurnoParaNotificar } from './turno.service';

export function esVideoconsulta(turno: TurnoParaNotificar): boolean {
  return turno.modalidadConsulta === 'videoconsulta';
}

export function linkMeetDelTurno(turno: TurnoParaNotificar): string | null {
  const nested = turno.videoconsulta?.linkMeet?.trim();
  if (nested) return nested;
  return turno.linkMeet?.trim() || null;
}

/** Arma la plantilla de recordatorio según modalidad y datos del turno. */
export function plantillaRecordatorioParaTurno(
  turno: TurnoParaNotificar,
): { template: TemplateMessage; tipo: 'videoconsulta' | 'turno' } | { error: string } {
  const hora = formatSoloHoraDesdeString(turno.horaInicio);

  if (esVideoconsulta(turno)) {
    const meetCode = extractMeetCode(linkMeetDelTurno(turno));
    if (meetCode) {
      return {
        tipo: 'videoconsulta',
        template: templates.videoconsultaRecordatorio(
          turno.pacienteNombre,
          turno.profesionalNombre,
          hora,
          meetCode,
        ),
      };
    }
  }

  if (!turno.accessToken?.trim()) {
    return { error: 'sin_access_token' };
  }

  const fecha = formatSoloFechaHumanaWhatsApp(turno.fecha.toDate());
  return {
    tipo: 'turno',
    template: templates.turnoRecordatorio(
      turno.pacienteNombre,
      fecha,
      hora,
      turno.profesionalNombre,
      turno.accessToken.trim(),
    ),
  };
}
