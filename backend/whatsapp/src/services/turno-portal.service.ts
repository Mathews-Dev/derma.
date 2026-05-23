import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { EstadoTurno } from '../types/turno.types';

const HORAS_MINIMAS_CAMBIO = 24;

export interface TurnoPortalPublico {
  id: string;
  pacienteId: string;
  pacienteNombre: string;
  profesionalNombre: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: string;
  estadoPago: string;
  monto: number;
  puedeModificar: boolean;
  horasRestantes: number;
  mensajePolitica: string;
}

function turnoInicio(fecha: Timestamp, horaInicio: string): Date {
  const d = fecha.toDate();
  const [h, m] = horaInicio.split(':').map(Number);
  d.setHours(h ?? 0, m ?? 0, 0, 0);
  return d;
}

function horasHasta(inicio: Date): number {
  return (inicio.getTime() - Date.now()) / (1000 * 60 * 60);
}

export async function getTurnoByAccessToken(
  accessToken: string,
): Promise<TurnoPortalPublico | null> {
  const db = getFirestore();
  const snap = await db
    .collection('turnos')
    .where('accessToken', '==', accessToken)
    .limit(1)
    .get();

  if (snap.empty) return null;

  const doc = snap.docs[0];
  const data = doc.data();
  const inicio = turnoInicio(data['fecha'] as Timestamp, data['horaInicio'] as string);
  const horasRestantes = horasHasta(inicio);
  const estado = data['estado'] as string;
  const activo = estado === EstadoTurno.CONFIRMADO || estado === EstadoTurno.PENDIENTE;
  const puedeModificar = activo && horasRestantes >= HORAS_MINIMAS_CAMBIO;

  let mensajePolitica = '';
  if (!activo) {
    mensajePolitica = 'Este turno ya no está activo.';
  } else if (horasRestantes < HORAS_MINIMAS_CAMBIO) {
    mensajePolitica =
      'Faltan menos de 24 horas para la cita. Ya no podés cancelar ni cambiar la fecha desde la web.';
  } else {
    mensajePolitica =
      'Podés cancelar o cambiar la fecha desde esta página. Para un nuevo turno después de cancelar, deberás abonar nuevamente.';
  }

  return {
    id: doc.id,
    pacienteId: data['pacienteId'] as string,
    pacienteNombre: data['pacienteNombre'] as string,
    profesionalNombre: data['profesionalNombre'] as string,
    fecha: inicio.toISOString(),
    horaInicio: data['horaInicio'] as string,
    horaFin: data['horaFin'] as string,
    estado,
    estadoPago: data['estadoPago'] as string,
    monto: (data['monto'] as number) ?? 0,
    puedeModificar,
    horasRestantes: Math.max(0, Math.round(horasRestantes * 10) / 10),
    mensajePolitica,
  };
}

export async function cancelarTurnoPorAccessToken(
  accessToken: string,
  motivo: string,
  pacienteUid?: string,
): Promise<void> {
  const db = getFirestore();
  const snap = await db
    .collection('turnos')
    .where('accessToken', '==', accessToken)
    .limit(1)
    .get();

  if (snap.empty) {
    throw new Error('Turno no encontrado');
  }

  const doc = snap.docs[0];
  const data = doc.data();
  const estado = data['estado'] as string;

  if (estado !== EstadoTurno.CONFIRMADO && estado !== EstadoTurno.PENDIENTE) {
    throw new Error('Este turno no se puede cancelar');
  }

  if (pacienteUid && data['pacienteId'] !== pacienteUid) {
    throw new Error('No tenés permiso para cancelar este turno');
  }

  const inicio = turnoInicio(data['fecha'] as Timestamp, data['horaInicio'] as string);
  if (horasHasta(inicio) < HORAS_MINIMAS_CAMBIO) {
    throw new Error('No se puede cancelar con menos de 24 horas de anticipación');
  }

  await doc.ref.update({
    estado: EstadoTurno.CANCELADO,
    motivo: motivo || 'Cancelado por el paciente desde la web',
    fechaModificacion: Timestamp.now(),
  });

  try {
    const clinicaId = data['clinicaId'] as string;
    const profesionalId = data['profesionalId'] as string;
    const fecha = (data['fecha'] as Timestamp).toDate();
    const y = fecha.getFullYear();
    const mo = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    const hm = (data['horaInicio'] as string).replace(':', '');
    const slotId = `${clinicaId}_${profesionalId}_${y}${mo}${day}_${hm}`;
    const slotRef = db.collection('turno_slots').doc(slotId);
    const slotSnap = await slotRef.get();
    if (slotSnap.exists) {
      await slotRef.update({ estado: 'cancelado' });
    }
  } catch {
    /* slot opcional */
  }
}
