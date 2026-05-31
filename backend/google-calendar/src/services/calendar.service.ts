import { google } from 'googleapis';
import { env } from '../config/env';
import { obtenerRefreshTokenDelDoctor } from './profesional.service';
import { CrearEventoParams, ResultadoEvento } from '../types/calendar.types';

const TIME_ZONE = 'America/Argentina/Jujuy';

function crearClienteCalendar(refreshTokenDelDoctor: string) {
  const clienteOAuth = new google.auth.OAuth2(
    env.googleClientId,
    env.googleClientSecret,
    env.googleRedirectUri,
  );

  clienteOAuth.setCredentials({ refresh_token: refreshTokenDelDoctor });

  return google.calendar({ version: 'v3', auth: clienteOAuth });
}

function emailValidoParaCalendar(email: string | undefined | null): boolean {
  const e = email?.trim() ?? '';
  return e.length > 0 && e.includes('@') && e.includes('.');
}

export async function crearEvento(
  parametros: CrearEventoParams,
): Promise<ResultadoEvento> {
  const refreshToken = await obtenerRefreshTokenDelDoctor(parametros.profesionalUid);
  const clienteCalendar = crearClienteCalendar(refreshToken);

  const incluirAsistente = emailValidoParaCalendar(parametros.pacienteEmail);

  const reminderEmailMin = env.calendarReminderEmailMinutes;
  const reminderPopupMin = env.calendarReminderPopupMinutes;

  console.log('[calendar] crearEvento inicio', {
    turnoId: parametros.turnoId,
    profesionalUid: parametros.profesionalUid,
    esVideoconsulta: parametros.esVideoconsulta,
    fechaInicio: parametros.fechaInicio,
    fechaFin: parametros.fechaFin,
    incluirAsistente,
    pacienteEmail: incluirAsistente ? parametros.pacienteEmail?.trim() : '(omitido — sin email válido)',
    reminderEmailMinutos: reminderEmailMin,
    reminderPopupMinutos: reminderPopupMin,
  });

  const datosDelEvento: Record<string, unknown> = {
    summary: parametros.tituloEvento,
    description: parametros.descripcion,
    start: { dateTime: parametros.fechaInicio, timeZone: TIME_ZONE },
    end: { dateTime: parametros.fechaFin, timeZone: TIME_ZONE },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: reminderEmailMin },
        { method: 'popup', minutes: reminderPopupMin },
      ],
    },
  };

  if (incluirAsistente) {
    datosDelEvento['attendees'] = [
      {
        email: parametros.pacienteEmail!.trim(),
        displayName: parametros.pacienteNombre,
      },
    ];
  }

  if (parametros.esVideoconsulta) {
    datosDelEvento['conferenceData'] = {
      createRequest: {
        requestId: `meet-${parametros.turnoId}-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    };
  }

  const respuesta = await clienteCalendar.events.insert({
    calendarId: 'primary',
    requestBody: datosDelEvento,
    conferenceDataVersion: parametros.esVideoconsulta ? 1 : 0,
    sendUpdates: 'all',
  });

  const eventoCreado = respuesta.data;
  const meetLink = eventoCreado.conferenceData?.entryPoints?.[0]?.uri ?? null;

  console.log('[calendar] crearEvento ok', {
    turnoId: parametros.turnoId,
    googleEventId: eventoCreado.id,
    meetLink,
    htmlLink: eventoCreado.htmlLink ?? null,
    conferenceStatus: eventoCreado.conferenceData?.conferenceId ?? null,
  });

  return {
    googleEventId: eventoCreado.id!,
    meetLink,
    linkEvento: eventoCreado.htmlLink ?? null,
  };
}

export async function cancelarEvento(
  profesionalUid: string,
  googleEventId: string,
): Promise<void> {
  const refreshToken = await obtenerRefreshTokenDelDoctor(profesionalUid);
  const clienteCalendar = crearClienteCalendar(refreshToken);

  await clienteCalendar.events.delete({
    calendarId: 'primary',
    eventId: googleEventId,
    sendUpdates: 'all',
  });
}

export async function actualizarEvento(
  profesionalUid: string,
  googleEventId: string,
  nuevaFechaInicio: string,
  nuevaFechaFin: string,
): Promise<void> {
  const refreshToken = await obtenerRefreshTokenDelDoctor(profesionalUid);
  const clienteCalendar = crearClienteCalendar(refreshToken);

  await clienteCalendar.events.patch({
    calendarId: 'primary',
    eventId: googleEventId,
    requestBody: {
      start: { dateTime: nuevaFechaInicio, timeZone: TIME_ZONE },
      end: { dateTime: nuevaFechaFin, timeZone: TIME_ZONE },
    },
    sendUpdates: 'all',
  });
}
