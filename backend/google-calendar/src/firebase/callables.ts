import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { crearEventoHandler } from '../handlers/crear-evento.handler';
import { cancelarEvento } from '../services/calendar.service';
import { desconectarGoogleCalendar } from '../services/profesional.service';
import {
  assertCanDisconnectCalendar,
  assertCanManageProfesionalCalendar,
} from '../utils/calendar-auth.util';
import type { CrearEventoParams } from '../types/calendar.types';

const SECRETS = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_REDIRECT_URI',
  'ENCRYPTION_KEY',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'WHATSAPP_BACKEND_URL',
] as const;

export const crearEventoCalendario = onCall<CrearEventoParams>(
  {
    region: 'southamerica-east1',
    secrets: [...SECRETS],
  },
  async request => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Debes iniciar sesión');
    }

    const data = request.data;
    await assertCanManageProfesionalCalendar(request.auth.uid, data.profesionalUid);

    try {
      return await crearEventoHandler(data);
    } catch (error) {
      console.error('[crearEventoCalendario] Error:', error);
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpsError('internal', message);
    }
  },
);

export const cancelarEventoCalendario = onCall<{ profesionalUid: string; googleEventId: string }>(
  {
    region: 'southamerica-east1',
    secrets: [...SECRETS],
  },
  async request => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Debes iniciar sesión');
    }

    const { profesionalUid, googleEventId } = request.data ?? {};
    if (!profesionalUid?.trim() || !googleEventId?.trim()) {
      throw new HttpsError('invalid-argument', 'Faltan profesionalUid y googleEventId');
    }

    await assertCanManageProfesionalCalendar(request.auth.uid, profesionalUid);

    try {
      await cancelarEvento(profesionalUid, googleEventId);
      return { ok: true, mensaje: 'Evento cancelado en Google Calendar' };
    } catch (error) {
      console.error('[cancelarEventoCalendario] Error:', error);
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpsError('internal', message);
    }
  },
);

export const desconectarGoogleCalendario = onCall<{ profesionalUid: string }>(
  {
    region: 'southamerica-east1',
    secrets: ['ENCRYPTION_KEY', 'FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'],
  },
  async request => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Debes iniciar sesión');
    }

    const { profesionalUid } = request.data ?? {};
    if (!profesionalUid) {
      throw new HttpsError('invalid-argument', 'Falta profesionalUid');
    }

    await assertCanDisconnectCalendar(request.auth.uid, profesionalUid);
    await desconectarGoogleCalendar(profesionalUid);

    return { ok: true, mensaje: 'Google Calendar desconectado' };
  },
);
