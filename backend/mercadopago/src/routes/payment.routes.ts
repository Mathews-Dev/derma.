import { Router } from 'express';
import { validatePaymentBody } from '../middlewares/validate.middleware';
import { idempotencyMiddleware } from '../middlewares/idempotency.middleware';
import { createPayment, getPaymentStatus } from '../controllers/payment.controller';

const router = Router();

router.post('/', validatePaymentBody, idempotencyMiddleware, createPayment);
router.get('/status/:external_reference', getPaymentStatus);

export default router;
