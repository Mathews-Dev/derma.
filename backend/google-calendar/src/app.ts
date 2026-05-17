import express from 'express';
import cors from 'cors';
import { authRoutes } from './routes/auth.routes';
import { calendarRoutes } from './routes/calendar.routes';
import { errorHandler } from './middlewares/error.middleware';

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) =>
  res.json({ status: 'ok', service: 'derma-google-calendar' }),
);

app.use('/auth', authRoutes);
app.use('/calendario', calendarRoutes);

app.use(errorHandler);
