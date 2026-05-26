import express from 'express';
import cors    from 'cors';
import { webhookRoutes } from './routes/webhook.routes';
import { messageRoutes } from './routes/message.routes';
import { publicTurnoRoutes } from './routes/public-turno.routes';
import { errorHandler }  from './middlewares/error.middleware';
import { env } from './config/env';
import { runRecordatorios } from './firebase/scheduler';

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'derma-whatsapp' }));

app.use('/webhook',  webhookRoutes);
app.use('/messages', messageRoutes);
app.use('/public', publicTurnoRoutes);

if (env.WHATSAPP_DEV_TOOLS) {
  app.post('/dev/recordatorios', async (_req, res, next) => {
    try {
      await runRecordatorios();
      res.json({ ok: true, mensaje: 'Job recordatorios ejecutado (turnos de mañana)' });
    } catch (e) {
      next(e);
    }
  });
}

app.use(errorHandler);