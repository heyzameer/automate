"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.planLimit = void 0;
const planLimit = (countFn, limitKey) => {
    return async (req, res, next) => {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) {
                return res.status(403).json({ success: false, message: 'Tenant ID required for plan limit check' });
            }
            // We need the tenant's limits. In a real app, this would be in req.user or fetched from cache.
            // For now, let's assume it's attached to the request by a previous middleware or we fetch it here.
            // Simplified version:
            const currentCount = await countFn(tenantId);
            // This is a placeholder. In reality, you'd get the limit from the Tenant record.
            // We'll assume the limit is passed in or attached to the user/request.
            const limit = req.user?.limits?.[limitKey] || 50;
            if (currentCount >= limit) {
                return res.status(403).json({
                    success: false,
                    message: `Plan limit reached for ${limitKey}. Current: ${currentCount}, Limit: ${limit}. Upgrade your plan.`
                });
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.planLimit = planLimit;
