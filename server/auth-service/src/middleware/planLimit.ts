import { Request, Response, NextFunction } from 'express';
import { Tenant } from '../models/Tenant';
import { sendError } from '../utils/response';
import mongoose from 'mongoose';

/**
 * Factory function to create a plan limit middleware.
 * @param resourceType - The type of resource to check ('cars' | 'leads')
 * @param countFunction - A function that returns a Promise resolving to the current count of the resource for the given tenantId
 */
export const checkPlanLimit = (
    resourceType: 'cars' | 'leads',
    countFunction: (tenantId: string) => Promise<number>
) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user || !req.user.tenantId) {
                return sendError(res, 'Authentication and valid tenant required', 401);
            }

            const tenantId = req.user.tenantId;

            // 1. Fetch Tenant to get current limits
            const tenant = await Tenant.findById(tenantId);
            
            if (!tenant) {
                return sendError(res, 'Tenant not found', 404);
            }

            const maxLimit = resourceType === 'cars' 
                ? (tenant.limits?.maxCars ?? 50) 
                : (tenant.limits?.maxLeads ?? 100);

            // 2. Execute the provided count function to get current usage
            const currentCount = await countFunction(tenantId);

            // 3. Compare current count with max limit
            if (currentCount >= maxLimit) {
                return sendError(
                    res, 
                    `Plan limit reached. You can only create up to ${maxLimit} ${resourceType}. Please upgrade your plan.`, 
                    403
                );
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};
