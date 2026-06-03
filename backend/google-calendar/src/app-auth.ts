import express from 'express';
import cors from 'cors';
import { authRoutes } from './routes/auth.routes';
import { errorHandler } from './middlewares/error.middleware';

/** Express app solo para OAuth (producción). Operaciones de calendario vía Callable Functions. */
export const authApp = express();

authApp.use(cors());
authApp.use(express.json());

authApp.get('/health', (_req, res) =>
  res.json({ status: 'ok', service: 'derma-google-calendar-auth' }),
);

authApp.use('/auth', authRoutes);

authApp.use(errorHandler);
