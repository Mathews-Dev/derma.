import { existsSync } from 'fs';
import { resolve } from 'path';
import { config as loadEnv } from 'dotenv';
import { initFirebaseAdmin } from './config/firebase-admin';
import { app } from './app';
import { env } from './config/env';

for (const p of [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), 'backend/google-calendar/.env'),
]) {
  if (existsSync(p)) {
    loadEnv({ path: p });
    break;
  }
}

initFirebaseAdmin();

app.listen(env.port, () => {
  console.log(`[Derma Google Calendar] corriendo en http://localhost:${env.port}`);
});
