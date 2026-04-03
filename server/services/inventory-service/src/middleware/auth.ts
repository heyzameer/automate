import { Request, Response, NextFunction } from 'express';
import { RequestUser, UserRole } from '../types';

/**
 * Middleware to trust identity headers injected by the Api Gateway.
 * In a secure microservices environment, this service would only allow
 * traffic from the Gateway's internal IP.
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const userId = req.headers['x-user-id'] as string;
    const userRole = req.headers['x-user-role'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    if (userId) {
        req.user = {
            userId,
            role: (userRole as UserRole) || UserRole.CUSTOMER,
            tenantId,
            email: '' // Not essential for inventory operations
        } as RequestUser;
    }

    next();
};

/**
 * RBAC Middleware
 */
export const authorize = (...roles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden: You do not have the required role'
            });
        }
        next();
    };
};
