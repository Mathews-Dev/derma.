import { initFirebaseAdmin } from '../config/firebase-admin';
import { enviarRecordatorios } from '../services/reminder.service';

export async function runRecordatorios(): Promise<void> {
  initFirebaseAdmin();
  await enviarRecordatorios();
}