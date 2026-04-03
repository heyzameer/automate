import { Router } from 'express';
import { WebhookController } from '../controllers/WebhookController';
import { container } from 'tsyringe';

const router = Router();
const controller = container.resolve(WebhookController);

// Meta verification (GET)
router.get('/', controller.verifyWebhook.bind(controller));

// Incoming messages (POST)
router.post('/', controller.handleWebhook.bind(controller));

export default router;
