import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { InventoryService } from '../services/InventoryService';
import { sendSuccess } from '../utils/response';
import { logger } from '../utils/logger';

@injectable()
export class PublicInventoryController {
    constructor(
        @inject('InventoryService') private inventoryService: InventoryService
    ) { }

    async getVehicles(req: Request, res: Response) {
        try {
            const tenantId = req.headers['x-tenant-id'] as string || req.query.tenantId as string;
            if (!tenantId) {
                return res.status(400).json({ success: false, message: 'Tenant ID required' });
            }

            const vehicles = await this.inventoryService.getVehicles(tenantId, {
                ...req.query,
                status: 'available' // Public only sees available stock
            });
            return sendSuccess(res, 'Inventory fetched', { vehicles });
        } catch (error: any) {
            logger.error('[PUBLIC_INVENTORY] Error fetching vehicles:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch inventory' });
        }
    }

    async getVehicleById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const tenantId = req.headers['x-tenant-id'] as string || req.query.tenantId as string;
            if (!tenantId) {
                return res.status(400).json({ success: false, message: 'Tenant ID required' });
            }

            const vehicle = await this.inventoryService.getVehicleById(id, tenantId);
            if (!vehicle) {
                return res.status(404).json({ success: false, message: 'Vehicle not found' });
            }

            return sendSuccess(res, 'Vehicle details fetched', { vehicle });
        } catch (error: any) {
            logger.error('[PUBLIC_INVENTORY] Error fetching vehicle detail:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch vehicle detail' });
        }
    }

    async getVehicleByCode(req: Request, res: Response) {
        try {
            const { code } = req.params; // e.g., 'car01'
            const tenantId = req.headers['x-tenant-id'] as string || req.query.tenantId as string;
            if (!tenantId) {
                return res.status(400).json({ success: false, message: 'Tenant ID required' });
            }

            // Find by attributes.car_code
            const vehicles = await this.inventoryService.getVehicles(tenantId, {
                car_code: code,
                status: 'available'
            });
            
            const vehicle = vehicles[0];
            if (!vehicle) {
                return res.status(404).json({ success: false, message: `Vehicle with code ${code} not found` });
            }

            return sendSuccess(res, 'Vehicle details fetched via QR', { vehicle });
        } catch (error: any) {
            logger.error('[PUBLIC_INVENTORY] Error fetching vehicle by code:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch details' });
        }
    }

    async submitSellRequest(req: Request, res: Response) {
        try {
            const tenantId = req.headers['x-tenant-id'] as string || req.body.tenantId;
            if (!tenantId) {
                return res.status(400).json({ success: false, message: 'Tenant ID required' });
            }

            const { customerName, customerPhone, carDetails } = req.body;
            
            // Basic Validation
            if (!customerName || !customerPhone || !carDetails?.brand || !carDetails?.model) {
                return res.status(400).json({ success: false, message: 'Missing required fields' });
            }

            const request = await this.inventoryService.createSellRequest({
                tenantId,
                customerName,
                customerPhone,
                carDetails,
                status: 'pending'
            });

            return sendSuccess(res, 'Your request has been submitted successfully. Our team will contact you soon.', { requestId: request._id });
        } catch (error: any) {
            logger.error('[PUBLIC_INVENTORY] Error submitting sell request:', error);
            res.status(500).json({ success: false, message: 'Submission failed' });
        }
    }
}
