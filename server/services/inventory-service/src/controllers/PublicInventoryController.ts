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
                status: { $in: ['available', 'booked'] } // Public sees available and booked stock
            });

            const maskedVehicles = vehicles.map(v => this.maskVehicle(v));
            return sendSuccess(res, 'Inventory fetched', { vehicles: maskedVehicles });
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

            return sendSuccess(res, 'Vehicle details fetched', { vehicle: this.maskVehicle(vehicle) });
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
                status: { $in: ['available', 'booked'] }
            });
            
            const vehicle = vehicles[0];
            if (!vehicle) {
                return res.status(404).json({ success: false, message: `Vehicle with code ${code} not found` });
            }

            return sendSuccess(res, 'Vehicle details fetched via QR', { vehicle: this.maskVehicle(vehicle) });
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

            /**
             * EXPECTED FIELDS:
             * - customerName (string)
             * - customerPhone (string)
             * - carDetails: {
             *    brand (string),
             *    model (string),
             *    year (number),
             *    variant (string),
             *    kmDriven (number),
             *    fuelType (string),
             *    transmission (string),
             *    ownership (string),
             *    expectedPrice (number)
             * },
             * - photos: string[] (at least 5)
             */
            const { customerName, customerPhone, carDetails, photos } = req.body;
            
            // Comprehensive Validation
            if (!customerName || !customerPhone || !carDetails?.brand || !carDetails?.model || !carDetails?.year) {
                return res.status(400).json({ success: false, message: 'Missing required fields (Name, Phone, Brand, Model, Year)' });
            }

            if (!photos || !Array.isArray(photos) || photos.length < 5) {
                return res.status(400).json({ success: false, message: 'At least 5 photos are required to submit a sell request.' });
            }

            const request = await this.inventoryService.createSellRequest({
                tenantId,
                customerName,
                customerPhone,
                carDetails,
                photos,
                status: 'pending'
            });


            return sendSuccess(res, 'Your request has been submitted successfully. Our team will contact you soon.', { requestId: request._id });
        } catch (error: any) {
            logger.error('[PUBLIC_INVENTORY] Error submitting sell request:', error);
            res.status(500).json({ success: false, message: 'Submission failed' });
        }
    }

    private maskVehicle(v: any) {
        const vehicle = v.toObject ? v.toObject() : { ...v };
        
        // 1. Remove sensitive financials
        delete vehicle.purchasePrice;
        delete vehicle.refurbishmentCost;
        delete vehicle.otherExpenses;
        
        // 2. Remove sensitive documents and history
        delete vehicle.rcNumber;
        delete vehicle.service_history;
        
        // 3. Mask Plate Number in attributes
        // attributes is a Map in Mongoose, but toObject() converts it to an object or Map depending on options
        const attrs = vehicle.attributes instanceof Map ? Object.fromEntries(vehicle.attributes) : vehicle.attributes;
        
        if (attrs && attrs.plate_number) {
            const plate = attrs.plate_number;
            // Example: KA-01-AB-1234 -> KA-01-**-1234
            if (typeof plate === 'string') {
                if (plate.includes('-')) {
                    const parts = plate.split('-');
                    if (parts.length >= 3) {
                        parts[parts.length - 2] = '**';
                        attrs.plate_number = parts.join('-');
                    } else {
                        attrs.plate_number = plate.replace(/[0-9]{2}/, '**');
                    }
                } else if (plate.length > 4) {
                    // KA01AB1234 -> KA01**1234
                    const mid = Math.floor(plate.length / 2);
                    attrs.plate_number = plate.substring(0, mid - 1) + '**' + plate.substring(mid + 1);
                } else {
                    attrs.plate_number = '****';
                }
            }
        }
        
        vehicle.attributes = attrs;
        return vehicle;
    }
}
