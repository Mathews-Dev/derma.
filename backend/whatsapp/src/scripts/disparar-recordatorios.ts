/**
 * Ejecuta el mismo job que la Cloud Function `recordatorios` (turnos de mañana).
 *
 * Uso (desde la raíz del monorepo, con .env cargado):
 *   npx nx run whatsapp:recordatorios
 */
import { existsSync } from 'fs';
import { resolve } from 'path';
import { config as loadEnv } from 'dotenv';
import { runRecordatorios } from '../firebase/scheduler';

for (const p of [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), 'backend/whatsapp/.env'),
]) {
  if (existsSync(p)) loadEnv({ path: p });
}

runRecordatorios()
  .then(() => {
    console.log('[disparar-recordatorios] Listo.');
    process.exit(0);
  })
  .catch(err => {
    console.error('[disparar-recordatorios] Error:', err);
    process.exit(1);
  });
