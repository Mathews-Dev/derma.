import { Router } from 'express';
import {
  iniciarConexionConGoogle,
  recibirCallbackDeGoogle,
} from '../controllers/auth.controller';

export const authRoutes = Router();

// La ruta fija debe ir ANTES que /:profesionalUid; si no, "callback" se toma como UID.
authRoutes.get('/google/callback', recibirCallbackDeGoogle);
authRoutes.get('/google/:profesionalUid', iniciarConexionConGoogle);
