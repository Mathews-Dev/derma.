import { db } from '../config/firebase.js';
import { Timestamp } from 'firebase-admin/firestore';

const IDEMPOTENCY_COLLECTION = 'idempotency_keys';
const PAYMENTS_COLLECTION = 'processed_payments';
const TTL_HOURS = 24;

// ─── Idempotencia de preferencias (doble click) ──────────────────────────────

export async function findIdempotencyKey(key) {
  try {
    const doc = await db.collection(IDEMPOTENCY_COLLECTION).doc(key).get();
    return doc.exists ? doc.data() : null;
  } catch {
    return null;
  }
}

export async function markAsProcessing(key) {
  const now = Timestamp.now();
  const expiresAt = Timestamp.fromMillis(Date.now() + TTL_HOURS * 60 * 60 * 1000);
  await db.collection(IDEMPOTENCY_COLLECTION).doc(key).set({
    key,
    status: 'processing',
    response: null,
    createdAt: now,
    expiresAt,
  });
}

export async function markAsCompleted(key, response) {
  await db.collection(IDEMPOTENCY_COLLECTION).doc(key).update({
    status: 'completed',
    response,
    completedAt: Timestamp.now(),
  });
}

export async function deleteKey(key) {
  try {
    await db.collection(IDEMPOTENCY_COLLECTION).doc(key).delete();
  } catch {
    // No es crítico
  }
}

// ─── Idempotencia de webhook (pagos duplicados de MP) ────────────────────────

export async function isPaymentProcessed(paymentId) {
  try {
    const doc = await db.collection(PAYMENTS_COLLECTION).doc(String(paymentId)).get();
    return doc.exists;
  } catch {
    return false;
  }
}

export async function markPaymentAsProcessed({ paymentId, externalReference, status }) {
  await db.collection(PAYMENTS_COLLECTION).doc(String(paymentId)).set({
    payment_id: String(paymentId),
    external_reference: externalReference,
    status,
    processedAt: Timestamp.now(),
  });
}
