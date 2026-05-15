import express from 'express';
import cors    from 'cors';
import { webhookRoutes } from './routes/webhook.routes';
import { messageRoutes } from './routes/message.routes';
import { errorHandler }  from './middlewares/error.middleware';

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'derma-whatsapp' }));

app.use('/webhook',  webhookRoutes);
app.use('/messages', messageRoutes);

app.use(errorHandler);