import { db } from '../config/firebase.js';
import { Timestamp } from 'firebase-admin/firestore';

// Extrae el turnoId del external_reference: turno_${turnoId}_${timestamp13digitos}
function extractTurnoId(externalReference) {
  const match = externalReference?.match(/^turno_(.+)_\d{13}$/);
  return match ? match[1] : null;
}

export async function markTurnoAsPaid({ externalReference, paymentId, mpStatus, merchantOrderId }) {
  const turnoId = extractTurnoId(externalReference);

  if (!turnoId) {
    console.error('[Turno] No se pudo extraer turnoId de:', externalReference);
    return;
  }

  await db.collection('turnos').doc(turnoId).update({
    estadoPago: 'pagado',
    mpPaymentId: String(paymentId),
    mpStatus: mpStatus || 'approved',
    mpMerchantOrderId: merchantOrderId ? String(merchantOrderId) : null,
    mpExternalReference: externalReference,
    fechaPago: Timestamp.now(),
    fechaModificacion: Timestamp.now(),
  });

  console.log(`[Turno] Turno ${turnoId} marcado como pagado.`);
}

export async function updateTurnoWithPreference({ turnoId, preferenceId, externalReference, idempotencyKey, initPoint }) {
  await db.collection('turnos').doc(turnoId).update({
    mpPreferenceId: preferenceId,
    mpExternalReference: externalReference,
    mpIdempotencyKey: idempotencyKey || null,
    mpInitPoint: initPoint || null,
    fechaModificacion: Timestamp.now(),
  });
}
