import { Router, Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { CampaignService } from '../services/CampaignService';
import { logger } from '../utils/logger';

const router = Router();

// Secure internal-only auth check
router.use((req: Request, res: Response, next: NextFunction) => {
    const internalSecret = req.headers['x-internal-secret'];
    if (internalSecret !== 'carbot-internal-super-secret') {
        return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    next();
});

/**
 * POST /internal/new-arrival
 * Triggered by inventory service when a new car is added.
 */
router.post('/new-arrival', async (req, res) => {
    try {
        const { tenantId, vehicle } = req.body;
        const campaignService = container.resolve(CampaignService);
        
        // This method will find matching leads and create a draft
        await campaignService.handleNewArrival(tenantId, vehicle);
        
        res.json({ success: true, message: 'New arrival processed' });
    } catch (error: any) {
        logger.error('Error in new-arrival hook:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
