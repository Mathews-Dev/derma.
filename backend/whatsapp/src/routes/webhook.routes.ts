import { Router } from 'express';
import { webhookController } from '../controllers/webhook.controller';
import { metaSignature }     from '../middlewares/meta-signature.middleware';

export const webhookRoutes = Router();

webhookRoutes.get('/',  webhookController.verify);
webhookRoutes.post('/', metaSignature, webhookController.receive);