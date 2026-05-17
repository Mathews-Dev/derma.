import axios, { AxiosError } from 'axios';
import { env } from '../config/env';
import { extractMeetCode } from '../utils/meet.utils';

export async function notificarVideoconsultaConfirmada(params: {
  telefono: string;
  pacienteNombre: string;
  profesionalNombre: string;
  fechaHora: string;
  meetLink: string | null;
}): Promise<{ enviado: boolean; detalle?: unknown }> {
  const meetCode = extractMeetCode(params.meetLink);

  if (!meetCode) {
    console.warn('[notification] Sin código Meet; no se envía WhatsApp');
    return { enviado: false, detalle: 'sin_meet_link' };
  }

  const url = `${env.whatsappBackendUrl}/messages/videoconsulta-confirmada`;

  try {
    await axios.post(url, {
      telefono: params.telefono,
      pacienteNombre: params.pacienteNombre,
      profesionalNombre: params.profesionalNombre,
      fechaHora: params.fechaHora,
      meetCode,
    });
    return { enviado: true as const };
  } catch (err) {
    const error = err as AxiosError;
    const detail = error.response?.data ?? error.message;
    console.warn('[notification] WhatsApp no enviado (evento Calendar igual creado):', detail);
    return { enviado: false as const, detalle: detail };
  }
}
