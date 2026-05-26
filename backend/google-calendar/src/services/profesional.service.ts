import { getFirestore } from 'firebase-admin/firestore';
import { GoogleCalendarIntegracion } from '../types/calendar.types';
import { cifrarToken, descifrarToken } from './crypto.service';

/** Los dermatólogos viven en `usuarios` (misma colección que el admin Angular). */
const COLECCION_PROFESIONALES = 'usuarios';

const db = () => getFirestore();

export async function guardarTokenGoogleEnFirestore(
  profesionalUid: string,
  refreshToken: string,
  emailGoogle: string,
): Promise<void> {
  const tokenCifrado = cifrarToken(refreshToken);

  const datosGoogleCalendar: GoogleCalendarIntegracion = {
    conectado: true,
    refreshTokenCifrado: tokenCifrado,
    emailGoogle,
    calendarId: 'primary',
    fechaConexion: new Date().toISOString(),
  };

  await db()
    .collection(COLECCION_PROFESIONALES)
    .doc(profesionalUid)
    .set({ googleCalendar: datosGoogleCalendar }, { merge: true });
}

export async function obtenerRefreshTokenDelDoctor(
  profesionalUid: string,
): Promise<string> {
  const documentoDoctor = await db()
    .collection(COLECCION_PROFESIONALES)
    .doc(profesionalUid)
    .get();

  const datosDoctor = documentoDoctor.data();

  if (!datosDoctor?.googleCalendar?.conectado) {
    throw new Error(`El profesional ${profesionalUid} no tiene Google Calendar conectado`);
  }

  return descifrarToken(datosDoctor.googleCalendar.refreshTokenCifrado);
}

export async function desconectarGoogleCalendar(profesionalUid: string): Promise<void> {
  await db()
    .collection(COLECCION_PROFESIONALES)
    .doc(profesionalUid)
    .set(
      {
        googleCalendar: {
          conectado: false,
          refreshTokenCifrado: null,
          emailGoogle: null,
          calendarId: null,
          fechaConexion: null,
        },
      },
      { merge: true },
    );
}
