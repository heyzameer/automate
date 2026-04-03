import { Router } from 'express';
import { Vehicle } from '../models/Vehicle';
import { Lead } from '../models/Lead';

const router = Router();

// Secure internal-only auth check via shared secret header
router.use((req, res, next) => {
    const internalSecret = req.headers['x-internal-secret'];
    if (internalSecret !== 'carbot-internal-super-secret') {
        return res.status(403).json({ success: false, message: 'Forbidden: Internal Service Mesh Only' });
    }
    next();
});

/**
 * GET /internal/vehicles
 * Search vehicles by query params for the bot service.
 * Example: ?tenantId=xxx&brand=Tata&fuel_type=Electric&max_price=1000000
 */
router.get('/vehicles', async (req, res) => {
    try {
        const { tenantId, brand, model, fuel_type, year, max_price, car_code, status } = req.query;
        const filters: any = {};

        if (tenantId) filters.tenantId = tenantId;
        if (status) filters.status = status; else filters.status = 'available';
        if (brand) filters['attributes.brand'] = new RegExp(brand as string, 'i');
        if (model) filters['attributes.model'] = new RegExp(model as string, 'i');
        if (fuel_type) filters['attributes.fuel_type'] = new RegExp(fuel_type as string, 'i');
        if (year) filters['attributes.year_of_manufacture'] = Number(year);
        if (max_price) filters['attributes.price'] = { $lte: Number(max_price) };
        if (car_code) filters['attributes.car_code'] = car_code;

        const vehicles = await Vehicle.find(filters).sort({ createdAt: -1 }).limit(5);
        res.json({ success: true, data: vehicles });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /internal/leads
 * Create a test drive lead from the bot service.
 */
router.post('/leads', async (req, res) => {
    try {
        const lead = await Lead.create(req.body);
        res.status(201).json({ success: true, data: lead });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /internal/leads
 * Fetch leads for a customer by phone number.
 */
router.get('/leads', async (req, res) => {
    try {
        const { tenantId, phone } = req.query;
        const leads = await Lead.find({
            tenantId,
            phone,
            status: { $nin: ['cancelled', 'lost'] }
        }).sort({ createdAt: -1 }).limit(3);
        res.json({ success: true, data: leads });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PATCH /internal/leads/:id
 * Update a lead status or reschedule date.
 */
router.patch('/leads/:id', async (req, res) => {
    try {
        const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, data: lead });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
