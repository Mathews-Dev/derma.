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

export async function crearEvento(
  parametros: CrearEventoParams,
): Promise<ResultadoEvento> {
  const refreshToken = await obtenerRefreshTokenDelDoctor(parametros.profesionalUid);
  const clienteCalendar = crearClienteCalendar(refreshToken);

  const datosDelEvento: Record<string, unknown> = {
    summary: parametros.tituloEvento,
    description: parametros.descripcion,
    start: { dateTime: parametros.fechaInicio, timeZone: TIME_ZONE },
    end: { dateTime: parametros.fechaFin, timeZone: TIME_ZONE },
    attendees: [
      {
        email: parametros.pacienteEmail,
        displayName: parametros.pacienteNombre,
      },
    ],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 60 },
        { method: 'popup', minutes: 15 },
      ],
    },
  };

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
