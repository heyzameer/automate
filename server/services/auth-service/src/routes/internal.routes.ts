import { Router } from 'express';
import { Tenant } from '../models/Tenant';
import config from '../config';

const router = Router();

// A simple internal authentication bypass using a secure service-mesh token
router.use((req, res, next) => {
    const internalSecret = req.headers['x-internal-secret'];
    if (internalSecret !== config.internalSecret) {
        return res.status(403).json({ success: false, message: 'Forbidden: Internal Service Mesh Only' });
    }
    next();
});


// Create a fast-path internal controller method directly here or use the model
router.get('/tenants/whatsapp/:phoneNumberId', async (req, res) => {
    try {
        const { phoneNumberId } = req.params;
        const tenant = await Tenant.findOne({
            'whatsappConfig.phoneNumberId': phoneNumberId,
            isActive: true
        });

        if (!tenant) {
            return res.status(404).json({ success: false, message: 'Tenant not found' });
        }
        res.json({ success: true, data: tenant });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
