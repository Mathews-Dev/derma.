import 'dotenv/config';
import { initFirebaseAdmin } from './config/firebase-admin';
import { app }               from './app';
import { env }               from './config/env';

initFirebaseAdmin();

app.listen(env.PORT, () => {
  console.log(`[Derma WhatsApp] corriendo en http://localhost:${env.PORT}`);
});