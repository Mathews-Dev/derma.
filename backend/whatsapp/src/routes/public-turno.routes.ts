import { Router } from 'express';
import { publicTurnoController } from '../controllers/public-turno.controller';

export const publicTurnoRoutes = Router();

publicTurnoRoutes.get('/turnos/:accessToken', publicTurnoController.obtener);
publicTurnoRoutes.post('/turnos/:accessToken/cancelar', publicTurnoController.cancelar);
