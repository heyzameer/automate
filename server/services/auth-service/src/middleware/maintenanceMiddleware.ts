import { Request, Response, NextFunction } from 'express';
import { HttpStatus } from '../enums/HttpStatus';
// In a real app this would query a SystemSetting model or cache
// Keeping minimal implementation for template

export const maintenanceMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    // 1. Skip check for admin routes (so admins can turn it off)
    if (req.path.startsWith('/api/v1/admin')) {
        return next();
    }

    // 2. Skip check for specific essential routes (like auth check)
    if (req.path.includes('/auth/status') || req.path.includes('/health')) {
        return next();
    }

    try {
        const isMaintenance = false; // Replace with actual logic

        if (isMaintenance) {
            return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
                success: false,
                message: `The platform is currently undergoing scheduled maintenance to improve your experience. We expect to be back online very soon.`,
                maintenance: true
            });
        }
        next();
    } catch (error) {
        console.error('Maintenance check failed:', error);
        next();
    }
};
