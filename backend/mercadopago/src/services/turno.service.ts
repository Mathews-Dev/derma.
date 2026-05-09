import { db } from '../config/firebase';
import admin from 'firebase-admin';

function extractTurnoId(externalReference: string): string | null {
  const match = externalReference?.match(/^turno_(.+)_\d{13}$/);
  return match ? match[1] : null;
}

export async function markTurnoAsPaid(params: { externalReference: string, paymentId: string | number, mpStatus: string, merchantOrderId?: string | number }): Promise<void> {
  const turnoId = extractTurnoId(params.externalReference);

  if (!turnoId) {
    console.error('[Turno] No se pudo extraer turnoId de:', params.externalReference);
    return;
  }

  await db.collection('turnos').doc(turnoId).update({
    estadoPago: 'pagado',
    mpPaymentId: String(params.paymentId),
    mpStatus: params.mpStatus || 'approved',
    mpMerchantOrderId: params.merchantOrderId ? String(params.merchantOrderId) : null,
    mpExternalReference: params.externalReference,
    fechaPago: admin.firestore.Timestamp.now(),
    fechaModificacion: admin.firestore.Timestamp.now(),
  });

  console.log(`[Turno] Turno ${turnoId} marcado como pagado.`);
}

export async function updateTurnoWithPreference(params: { turnoId: string, preferenceId: string, externalReference: string, idempotencyKey?: string, initPoint?: string }): Promise<void> {
  await db.collection('turnos').doc(params.turnoId).update({
    mpPreferenceId: params.preferenceId,
    mpExternalReference: params.externalReference,
    mpIdempotencyKey: params.idempotencyKey || null,
    mpInitPoint: params.initPoint || null,
    fechaModificacion: admin.firestore.Timestamp.now(),
  });
}
