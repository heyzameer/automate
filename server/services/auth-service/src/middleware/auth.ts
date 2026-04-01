import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Tenant } from '../models/Tenant';
import { JWTPayload, UserRole } from '../types';
import { sendError } from '../utils/response';
import config from '../config';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return sendError(res, 'Authentication token required', 401);
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, config.jwtSecret) as JWTPayload;

            const user = await User.findById(decoded.userId);
            if (!user || !user.isActive) {
                return sendError(res, 'User not found or inactive', 401);
            }

            req.user = {
                userId: decoded.userId,
                email: decoded.email,
                role: decoded.role,
                tenantId: user.tenantId ? user.tenantId.toString() : undefined,
            };

            next();
        } catch (jwtError) {
            return sendError(res, 'Invalid or expired token', 401);
        }
    } catch (error) {
        next(error);
    }
};

export const authorize = (roles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return sendError(res, 'Authentication required', 401);
        }

        if (!roles.includes(req.user.role)) {
            return sendError(res, 'Insufficient permissions', 403);
        }

        next();
    };
};

export const superAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== UserRole.SUPER_ADMIN) {
        return sendError(res, 'Super admin access required', 403);
    }
    next();
};

export const tenantAuth = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return sendError(res, 'Authentication required', 401);
    }

    if (req.user.role === UserRole.SUPER_ADMIN) {
        return next();
    }

    if (!req.user.tenantId) {
        return sendError(res, 'No tenant associated with user', 403);
    }

    try {
        const tenant = await Tenant.findById(req.user.tenantId);
        if (!tenant || !tenant.isActive) {
            return sendError(res, 'Tenant is inactive or blocked. Please contact support.', 403);
        }
        
        if (tenant.expiryDate && new Date(tenant.expiryDate) < new Date()) {
            return sendError(res, 'Tenant subscription has expired. Please renew.', 403);
        }

        next();
    } catch (error) {
        next(error);
    }
};
