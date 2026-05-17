import { Router } from 'express';
import { calendarController } from '../controllers/calendar.controller';

export const calendarRoutes = Router();

calendarRoutes.post('/eventos', calendarController.crearEvento);
calendarRoutes.delete('/eventos', calendarController.cancelarEvento);
calendarRoutes.patch('/eventos', calendarController.actualizarEvento);
