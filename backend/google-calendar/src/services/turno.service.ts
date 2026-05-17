import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const db = () => getFirestore();

export async function actualizarTurnoConVideoconsulta(
  turnoId: string,
  datos: {
    meetLink: string | null;
    googleEventId: string;
    linkEvento?: string | null;
  },
): Promise<void> {
  await db()
    .collection('turnos')
    .doc(turnoId)
    .update({
      videoconsulta: {
        linkMeet: datos.meetLink,
        googleEventId: datos.googleEventId,
        linkEvento: datos.linkEvento ?? null,
        asistenciaLink: {
          profesionalEntro: null,
          pacienteEntro: null,
        },
      },
      fechaModificacion: new Date(),
      // Campos planos legacy (si existían de pruebas anteriores)
      linkMeet: FieldValue.delete(),
      googleEventId: FieldValue.delete(),
      asistenciaLink: FieldValue.delete(),
    });
}
