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


// Fetch tenant by internal database ID
router.get('/tenants/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const tenant = await Tenant.findById(id);
        if (!tenant) {
            return res.status(404).json({ success: false, message: 'Tenant not found' });
        }
        res.json({ success: true, data: tenant });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Fetch tenant by WhatsApp Phone Number ID (Used by Webhooks)
router.get('/tenants/whatsapp/:phoneNumberId', async (req, res) => {
    try {
        const { phoneNumberId } = req.params;
        const tenant = await Tenant.findOne({
            'whatsappConfig.phoneNumberId': phoneNumberId,
            isActive: true
        });

        if (!tenant) {
            return res.status(404).json({ success: false, message: 'Tenant not found or inactive' });
        }
        res.json({ success: true, data: tenant });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Fetch tenant by Kiosk Key
router.get('/tenants/kiosk/:key', async (req, res) => {
    try {
        const { key } = req.params;
        const tenant = await Tenant.findOne({ 'kioskConfig.kioskKey': key });

        if (!tenant) {
            return res.status(404).json({ success: false, message: 'Invalid kiosk key' });
        }

        if (!tenant.isActive) {
            return res.status(403).json({ success: false, message: 'Showroom account is inactive' });
        }

        if (!tenant.kioskConfig?.isActive) {
            return res.status(403).json({ success: false, message: 'Kiosk platform is disabled for this showroom' });
        }

        res.json({ success: true, data: tenant });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/config', async (req, res) => {
    try {
        const { SystemSetting } = require('../models/SystemSetting');
        let settings = await SystemSetting.findOne({});
        if (!settings) {
            settings = await SystemSetting.create({});
        }
        res.json({ success: true, data: settings });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
