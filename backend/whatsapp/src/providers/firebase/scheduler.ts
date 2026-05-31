import { initFirebaseAdmin } from '../../config/firebase.config';
import { procesarRecordatoriosPendientes } from '../../services/reminder.service';

/**
 * Scheduled task runner for processing pending reminders
 */
export async function runRecordatorios(): Promise<void> {
  initFirebaseAdmin();
  await procesarRecordatoriosPendientes();
}
