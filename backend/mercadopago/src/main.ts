import { existsSync } from 'fs';
import { resolve } from 'path';
import { config as loadEnv } from 'dotenv';
import { initFirebaseAdmin } from './config/firebase-admin';

for (const p of [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), 'backend/mercadopago/.env'),
]) {
  if (existsSync(p)) {
    loadEnv({ path: p });
  }
}
import { app } from './app';
import { env, logMpStartup } from './config/env';

initFirebaseAdmin();
logMpStartup();

app.listen(env.PORT, () => {
  console.log(`[Derma MercadoPago] corriendo en http://localhost:${env.PORT}`);
  console.log(`[Derma MercadoPago] health → http://localhost:${env.PORT}/health`);
});
