import { Router } from 'express';
import { validatePaymentBody } from '../middlewares/validate.middleware.js';
import { idempotencyMiddleware } from '../middlewares/idempotency.middleware.js';
import { createPayment, getPaymentStatus } from '../controllers/payment.controller.js';

const router = Router();

router.post('/', validatePaymentBody, idempotencyMiddleware, createPayment);
router.get('/status/:external_reference', getPaymentStatus);

export default router;
