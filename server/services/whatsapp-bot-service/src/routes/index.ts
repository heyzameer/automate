import { Router } from 'express';
import webhookRoutes from './webhook.routes';
import leadRoutes from './lead.routes';

const router = Router();

router.use('/webhooks', webhookRoutes);
router.use('/leads', leadRoutes);

// Health check
router.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'WhatsApp Bot Service' });
});

export default router;
