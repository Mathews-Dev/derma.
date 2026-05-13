import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { EstadoTurno } from '../types/turno.types';

export interface TurnoParaNotificar {
  id:                    string;
  pacienteNombre:        string;
  profesionalNombre:     string;
  horaInicio:            string;
  fecha:                 Timestamp;
  telefonoNotificaciones?: string | null;
  pacienteTelefono?:     string | null;
  notificacionesWhatsApp: boolean;
}

export async function getTurnosManana(): Promise<TurnoParaNotificar[]> {
  const db = getFirestore();

  const manana = new Date();
  manana.setDate(manana.getDate() + 1);

  const inicio = new Date(manana);
  inicio.setHours(0, 0, 0, 0);

  const fin = new Date(manana);
  fin.setHours(23, 59, 59, 999);

  const snap = await db
    .collection('turnos')
    .where('fecha', '>=', Timestamp.fromDate(inicio))
    .where('fecha', '<=', Timestamp.fromDate(fin))
    .where('estado', 'in', [EstadoTurno.CONFIRMADO, EstadoTurno.PENDIENTE])
    .where('notificacionesWhatsApp', '==', true)
    .get();

  return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as TurnoParaNotificar[];
}