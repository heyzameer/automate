import { Router, Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { IVehicleRepository } from '../interfaces/IRepository/IVehicleRepository';
import config from '../config';

const router = Router();
const vehicleRepository = container.resolve<IVehicleRepository>('VehicleRepository');

// Secure internal-only auth via shared mesh secret
router.use((req: Request, res: Response, next: NextFunction) => {
    const internalSecret = req.headers['x-internal-secret'];
    if (internalSecret !== config.internalSecret) {
        return res.status(403).json({ success: false, message: 'Forbidden: Internal Service Mesh Only' });
    }
    next();
});

import { SearchService } from '../services/SearchService';

/**
 * GET /internal/vehicles
 * Internal vehicle search for the bot service.
 * Supports filtering by tenantId, brand, model, fuel_type, year, max_price, car_code, status.
 */
router.get('/vehicles', async (req, res) => {
    try {
        const tenantId = req.query.tenantId as string;
        if (!tenantId) {
            return res.status(400).json({ success: false, message: 'Tenant ID is required for search' });
        }

        const searchService = container.resolve(SearchService);
        const vehicles = await searchService.searchVehicles(tenantId, req.query);
        
        // Ensure max 5 returned via limit
        res.json({ success: true, data: vehicles.slice(0, 5) });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/analytics', async (req, res) => {
    try {
        const tenantId = req.query.tenantId as string;
        if (!tenantId) return res.status(400).json({ success: false, message: 'tenantId required' });

        const vehicles = await vehicleRepository.find({ tenantId });
        
        const brandMap: Record<string, number> = {};
        vehicles.forEach(v => {
            const brand = v.attributes.get('brand') || 'Other';
            brandMap[brand] = (brandMap[brand] || 0) + 1;
        });

        res.json({
            success: true,
            data: {
                totalStock: vehicles.length,
                brandDistribution: Object.entries(brandMap).map(([brand, count]) => ({ brand, count })),
                avgDaysInStock: 22 // Simple mock for now
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
