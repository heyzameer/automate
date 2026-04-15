import { Router } from 'express';
import { WebhookController } from '../controllers/WebhookController';
import { container } from 'tsyringe';

import { verifyMetaSignature } from '../utils/webhook-security';

const router = Router();
const controller = container.resolve(WebhookController);

// Meta verification (GET)
router.get('/', controller.verifyWebhook.bind(controller));

// Incoming messages (POST) with HMAC verification
router.post('/', verifyMetaSignature, controller.handleWebhook.bind(controller));

export default router;
