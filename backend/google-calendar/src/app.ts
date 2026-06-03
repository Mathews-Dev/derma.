import express from 'express';
import cors from 'cors';
import { authRoutes } from './routes/auth.routes';
import { errorHandler } from './middlewares/error.middleware';

/** Local dev: OAuth HTTP. Crear eventos / desconectar → Callable Functions (deploy o emulator). */
export const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) =>
  res.json({ status: 'ok', service: 'derma-google-calendar' }),
);

app.use('/auth', authRoutes);

app.use(errorHandler);
