import express from 'express';
import cors from 'cors';
import paymentRoutes from './routes/payment.routes';
import webhookRoutes from './routes/webhook.routes';
import { errorHandler } from './middlewares/error.middleware';

export const app = express();

app.use(express.json());
app.use(cors());

app.get('/health', (req, res) => {
  res.send({ status: 'ok', service: 'derma-mercadopago' });
});

app.use('/api/payment', paymentRoutes);
app.use('/api/webhook', webhookRoutes);

app.use(errorHandler);
