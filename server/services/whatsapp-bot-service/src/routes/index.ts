import { Router } from 'express';
import webhookRoutes from './webhook.routes';
import leadRoutes from './lead.routes';
import internalRoutes from './internal.routes';
import publicRoutes from './public.routes';
import campaignRoutes from './campaign.routes';

const router = Router();

router.use('/webhooks', webhookRoutes);
router.use('/leads', leadRoutes);
router.use('/internal', internalRoutes);
router.use('/public', publicRoutes);
router.use('/campaigns', campaignRoutes);

// Health check
router.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'WhatsApp Bot Service' });
});

export default router;
