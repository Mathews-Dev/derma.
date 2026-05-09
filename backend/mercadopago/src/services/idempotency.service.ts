import { db } from '../config/firebase';
import admin from 'firebase-admin';

const IDEMPOTENCY_COLLECTION = 'idempotency_keys';
const PAYMENTS_COLLECTION = 'processed_payments';
const TTL_HOURS = 24;

export async function findIdempotencyKey(key: string): Promise<any> {
  try {
    const doc = await db.collection(IDEMPOTENCY_COLLECTION).doc(key).get();
    return doc.exists ? doc.data() : null;
  } catch {
    return null;
  }
}

export async function markAsProcessing(key: string): Promise<void> {
  const now = admin.firestore.Timestamp.now();
  const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + TTL_HOURS * 60 * 60 * 1000);
  await db.collection(IDEMPOTENCY_COLLECTION).doc(key).set({
    key,
    status: 'processing',
    response: null,
    createdAt: now,
    expiresAt,
  });
}

export async function markAsCompleted(key: string, response: any): Promise<void> {
  await db.collection(IDEMPOTENCY_COLLECTION).doc(key).update({
    status: 'completed',
    response,
    completedAt: admin.firestore.Timestamp.now(),
  });
}

export async function deleteKey(key: string): Promise<void> {
  try {
    await db.collection(IDEMPOTENCY_COLLECTION).doc(key).delete();
  } catch {
    // No es crítico
  }
}

export async function isPaymentProcessed(paymentId: string | number): Promise<boolean> {
  try {
    const doc = await db.collection(PAYMENTS_COLLECTION).doc(String(paymentId)).get();
    return doc.exists;
  } catch {
    return false;
  }
}

export async function markPaymentAsProcessed(params: { paymentId: string | number, externalReference: string, status: string }): Promise<void> {
  await db.collection(PAYMENTS_COLLECTION).doc(String(params.paymentId)).set({
    payment_id: String(params.paymentId),
    external_reference: params.externalReference,
    status: params.status,
    processedAt: admin.firestore.Timestamp.now(),
  });
}
