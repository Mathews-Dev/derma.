import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const IDEMPOTENCY_COLLECTION = 'idempotency_keys';
const PAYMENTS_COLLECTION = 'processed_payments';
const TTL_HOURS = 24;

export async function findIdempotencyKey(key: string): Promise<any> {
  try {
    const db = getFirestore();
    const doc = await db.collection(IDEMPOTENCY_COLLECTION).doc(key).get();
    return doc.exists ? doc.data() : null;
  } catch {
    return null;
  }
}

export async function markAsProcessing(key: string): Promise<void> {
  const db = getFirestore();
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

export async function markAsCompleted(key: string, response: any): Promise<void> {
  const db = getFirestore();
  await db.collection(IDEMPOTENCY_COLLECTION).doc(key).update({
    status: 'completed',
    response,
    completedAt: Timestamp.now(),
  });
}

export async function deleteKey(key: string): Promise<void> {
  try {
    const db = getFirestore();
    await db.collection(IDEMPOTENCY_COLLECTION).doc(key).delete();
  } catch {
    // No es crítico
  }
}

export async function isPaymentProcessed(paymentId: string | number): Promise<boolean> {
  try {
    const db = getFirestore();
    const doc = await db.collection(PAYMENTS_COLLECTION).doc(String(paymentId)).get();
    return doc.exists;
  } catch {
    return false;
  }
}

export async function markPaymentAsProcessed(params: { paymentId: string | number, externalReference: string, status: string }): Promise<void> {
  const db = getFirestore();
  await db.collection(PAYMENTS_COLLECTION).doc(String(params.paymentId)).set({
    payment_id: String(params.paymentId),
    external_reference: params.externalReference,
    status: params.status,
    processedAt: Timestamp.now(),
  });
}
