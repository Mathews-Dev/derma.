import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import paymentRoutes from './routes/payment.routes.js';
import webhookRoutes from './routes/webhook.routes.js';

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

app.use('/api/payment', paymentRoutes);
app.use('/api/webhook', webhookRoutes);

// Error handler global
app.use((err, req, res, next) => {
  console.error('[Error global]', err.message);
  res.status(500).json({ success: false, error: 'Error interno del servidor' });
});

export default app;
