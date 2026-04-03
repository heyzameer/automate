import { Request, Response, NextFunction } from 'express';

export const maintenanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Only block if a global MAINTENANCE_MODE env var is true
    if (process.env.MAINTENANCE_MODE === 'true') {
        return res.status(503).json({
            success: false,
            message: 'Inventory Service is undergoing maintenance. Please try again later.'
        });
    }
    next();
};
