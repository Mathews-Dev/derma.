import { Router } from 'express';
import { messageController } from '../controllers/message.controller';

export const messageRoutes = Router();

messageRoutes.post('/confirmar',    messageController.confirmar);
messageRoutes.post('/cancelar',     messageController.cancelar);
messageRoutes.post('/reprogramar',  messageController.reprogramar);
messageRoutes.post('/no-asistio',   messageController.noAsistio);
messageRoutes.post('/videoconsulta-confirmada', messageController.videoconsultaConfirmada);