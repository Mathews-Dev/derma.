import express from 'express';
import cors from 'cors';
import paymentRoutes from './routes/payment.routes';
import webhookRoutes from './routes/webhook.routes';

const app = express();

app.use(express.json());
app.use(cors());

app.use('/api/payment', paymentRoutes);
app.use('/api/webhook', webhookRoutes);

app.get('/', (req, res) => {
  res.send({ message: 'Hello API' });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Error global]', err.message);
  res.status(500).json({ success: false, error: 'Error interno del servidor' });
});

if (process.env.NODE_ENV !== 'production') {
  const host = process.env.HOST ?? 'localhost';
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  app.listen(port, host, () => {
    console.log(`[ ready ] http://${host}:${port}`);
  });
}

export default app;