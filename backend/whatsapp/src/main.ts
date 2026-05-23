import { existsSync } from 'fs';
import { resolve } from 'path';
import { config as loadEnv } from 'dotenv';
import { initFirebaseAdmin } from './config/firebase-admin';
import { app } from './app';
import { env } from './config/env';

// Cargar .env de la raíz del monorepo primero; luego overrides locales si existen.
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
  console.log(`[Derma WhatsApp] corriendo en http://localhost:${env.PORT}`);
  console.log(`[Derma WhatsApp] simulación: ${env.WHATSAPP_SIMULATION ? 'ON (no llama a Meta)' : 'OFF'}`);
  console.log('[Derma WhatsApp] idiomas plantilla:', {
    confirmado: env.META_TEMPLATE_LANG_CONFIRMADO,
    cancelado: env.META_TEMPLATE_LANG_CANCELADO,
    recordatorio: env.META_TEMPLATE_LANG_RECORDATORIO,
    reprogramado: env.META_TEMPLATE_LANG_REPROGRAMADO,
    noAsistio: env.META_TEMPLATE_LANG_NO_ASISTIO,
    videoconsulta: env.META_TEMPLATE_LANG_VIDEOCONSULTA,
  });
  console.log(`[Derma WhatsApp] phone_number_id=${env.META_PHONE_NUMBER_ID}`);
});
