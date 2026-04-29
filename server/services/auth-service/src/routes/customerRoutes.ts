import { Router } from 'express';
import { CustomerAuthController } from '../controllers/CustomerAuthController';
import { authenticate } from '../middleware/auth';

const router = Router();
const controller = new CustomerAuthController();

// Public Auth
router.post('/auth/request-otp', controller.requestOTP);
router.post('/auth/verify-otp', controller.verifyOTP);

// Protected
router.get('/profile', authenticate, controller.getProfile);

export default router;
