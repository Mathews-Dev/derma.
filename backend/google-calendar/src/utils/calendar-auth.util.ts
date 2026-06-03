import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';

const ROLES_STAFF = new Set(['admin', 'recepcionista', 'empleado']);

export async function assertCanManageProfesionalCalendar(
  callerUid: string,
  profesionalUid: string,
): Promise<void> {
  if (callerUid === profesionalUid) return;

  const doc = await getFirestore().collection('usuarios').doc(callerUid).get();
  const rol = doc.data()?.rol as string | undefined;

  if (rol && ROLES_STAFF.has(rol)) return;

  throw new HttpsError(
    'permission-denied',
    'No tenés permiso para gestionar el calendario de este profesional',
  );
}

export async function assertCanDisconnectCalendar(
  callerUid: string,
  profesionalUid: string,
): Promise<void> {
  if (callerUid === profesionalUid) return;

  const doc = await getFirestore().collection('usuarios').doc(callerUid).get();
  if (doc.data()?.rol === 'admin') return;

  throw new HttpsError(
    'permission-denied',
    'Solo podés desconectar tu propio Google Calendar',
  );
}
