import { Router } from 'express';
import { appointmentController } from '../controllers/appointment.controller';

export const appointmentRoutes = Router();

appointmentRoutes.get('/turnos/:accessToken', appointmentController.obtener);
appointmentRoutes.post('/turnos/:accessToken/cancelar', appointmentController.cancelar);
