import { existsSync } from 'fs';
import { resolve } from 'path';
import { config as loadEnv } from 'dotenv';
import { initFirebaseAdmin } from './config/firebase.config';
import { app } from './app';
import { env } from './config/env';

for (const p of [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), 'backend/whatsapp/.env'),
]) {
  if (existsSync(p)) {
    loadEnv({ path: p });
  }
}

initFirebaseAdmin();

app.listen(env.PORT, () => {
  console.log(`[Derma WhatsApp] running on http://localhost:${env.PORT}`);
  console.log(`[Derma WhatsApp] simulation: ${env.WHATSAPP_SIMULATION ? 'ON (no Meta calls)' : 'OFF'}`);
  console.log('[Derma WhatsApp] Meta templates language code: es_AR');
  console.log(`[Derma WhatsApp] phone_number_id=${env.META_PHONE_NUMBER_ID}`);
});
