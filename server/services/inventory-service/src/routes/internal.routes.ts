import { Router } from 'express';
import Vehicle from '../models/Vehicle';

const router = Router();

// Secure internal-only auth via shared mesh secret
router.use((req, res, next) => {
    const internalSecret = req.headers['x-internal-secret'];
    if (internalSecret !== 'carbot-internal-super-secret') {
        return res.status(403).json({ success: false, message: 'Forbidden: Internal Service Mesh Only' });
    }
    next();
});

/**
 * GET /internal/vehicles
 * Internal vehicle search for the bot service.
 * Supports filtering by tenantId, brand, model, fuel_type, year, max_price, car_code, status.
 */
router.get('/vehicles', async (req, res) => {
    try {
        const { tenantId, brand, model, fuel_type, year, max_price, car_code, status } = req.query;
        const filters: any = {};

        if (tenantId) filters.tenantId = tenantId;
        filters.status = status || 'available';
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

export default router;
