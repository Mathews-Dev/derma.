import { getFirestore, Timestamp } from 'firebase-admin/firestore';

function extractTurnoId(externalReference: string): string | null {
  const match = externalReference?.match(/^turno_(.+)_\d{13}$/);
  return match ? match[1] : null;
}

export async function markTurnoAsPaid(params: { externalReference: string, paymentId: string | number, mpStatus: string, merchantOrderId?: string | number }): Promise<void> {
  const db = getFirestore();
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
    fechaPago: Timestamp.now(),
    fechaModificacion: Timestamp.now(),
  });

  console.log(`[Turno] Turno ${turnoId} marcado como pagado.`);
}

export async function updateTurnoWithPreference(params: { turnoId: string, preferenceId: string, externalReference: string, idempotencyKey?: string, initPoint?: string }): Promise<void> {
  const db = getFirestore();
  await db.collection('turnos').doc(params.turnoId).update({
    mpPreferenceId: params.preferenceId,
    mpExternalReference: params.externalReference,
    mpIdempotencyKey: params.idempotencyKey || null,
    mpInitPoint: params.initPoint || null,
    fechaModificacion: Timestamp.now(),
  });
}
