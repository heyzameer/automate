import { Router } from 'express';
import { CustomerAuthController } from '../controllers/CustomerAuthController';
import { authenticate } from '../middleware/auth';

const router = Router();
const controller = new CustomerAuthController();

// Public Auth
router.post('/auth/request-otp', controller.requestOTP);
router.post('/auth/verify-otp', controller.verifyOTP);

// Kiosk Config (Public but guarded by kioskGuard in Gateway)
router.get('/kiosk-info', (req: any, res) => {
    const tenantId = req.headers['x-tenant-id'];
    if (!tenantId) return res.status(400).json({ success: false, message: 'Tenant ID missing' });
    
    // We can fetch the full tenant info here
    const { Tenant } = require('../models/Tenant');
    Tenant.findById(tenantId).then((tenant: any) => {
        if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });
        res.json({ success: true, data: tenant });
    }).catch((err: any) => res.status(500).json({ success: false, error: err.message }));
});

// Protected
router.get('/profile', authenticate, controller.getProfile);

export default router;
