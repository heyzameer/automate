import { Request, Response } from 'express';
import { Wishlist } from '../models/Wishlist';
import { sendSuccess } from '../utils/response';
import { logger } from '../utils/logger';

export class WishlistController {
    /**
     * POST /wishlist
     * Add vehicle to wishlist
     */
    async addToWishlist(req: Request, res: Response) {
        try {
            const { vehicleId, tenantId } = req.body;
            const customerId = (req as any).user?.userId;

            if (!vehicleId || !tenantId) {
                return res.status(400).json({ success: false, message: 'VehicleId and TenantId are required' });
            }

            const existing = await Wishlist.findOne({ customerId, vehicleId });
            if (existing) {
                return res.status(400).json({ success: false, message: 'Vehicle already in wishlist' });
            }

            const item = await Wishlist.create({
                customerId,
                vehicleId,
                tenantId
            });

            return sendSuccess(res, 'Added to wishlist', item);
        } catch (error: any) {
            logger.error('Error adding to wishlist:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    /**
     * DELETE /wishlist/:vehicleId
     * Remove from wishlist
     */
    async removeFromWishlist(req: Request, res: Response) {
        try {
            const { vehicleId } = req.params;
            const customerId = (req as any).user?.userId;

            await Wishlist.deleteOne({ customerId, vehicleId });
            return sendSuccess(res, 'Removed from wishlist');
        } catch (error: any) {
            logger.error('Error removing from wishlist:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    /**
     * GET /wishlist
     * Get customer wishlist
     */
    async getWishlist(req: Request, res: Response) {
        try {
            const customerId = (req as any).user?.userId;
            const tenantId = req.headers['x-tenant-id'] as string;

            const items = await Wishlist.find({ customerId, tenantId }).populate('vehicleId');
            return sendSuccess(res, 'Wishlist fetched', items.map(i => i.vehicleId));
        } catch (error: any) {
            logger.error('Error fetching wishlist:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
}
