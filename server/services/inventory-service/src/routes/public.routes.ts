import { Router } from 'express';
import { container } from '../container';
import { PublicInventoryController } from '../controllers/PublicInventoryController';
import rateLimit from 'express-rate-limit';

const router = Router();
const controller = container.resolve(PublicInventoryController);

// Rate limiting for public endpoints (100 requests per 15 minutes)
const publicLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, message: 'Too many requests, please try again later.' }
});

router.use(publicLimiter);

/**
 * PUBLIC INVENTORY ACCESS
 */
router.get('/vehicles', controller.getVehicles.bind(controller));
router.get('/vehicles/:id', controller.getVehicleById.bind(controller));
router.get('/qr/:code', controller.getVehicleByCode.bind(controller));

/**
 * PUBLIC LEAD GENERATION
 */
router.post('/sell-car', controller.submitSellRequest.bind(controller));

export default router;
