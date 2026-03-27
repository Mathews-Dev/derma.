import { Timestamp } from 'firebase/firestore';

export function fromTimestamp(ts: unknown): Date | null {
  if (!ts) return null;
  if (ts instanceof Timestamp) return ts.toDate();
  const obj = ts as Record<string, unknown>;
  if (typeof obj['seconds'] === 'number') return new Date(obj['seconds'] * 1000);
  if (typeof obj['toDate'] === 'function') return (obj['toDate'] as () => Date)();
  if (ts instanceof Date) return ts;
  return null;
}
