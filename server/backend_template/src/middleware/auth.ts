import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
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

            // Check if user still exists
            const user = await User.findById(decoded.userId);
            if (!user || !user.isActive) {
                return sendError(res, 'User not found or inactive', 401);
            }

            // Attach user to request
            req.user = {
                userId: decoded.userId,
                email: decoded.email,
                role: decoded.role,
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

export const authenticatePartner = async (req: Request, res: Response, next: NextFunction) => {
    // Can be combined or customized, but in reference repo, partnerAuth is its own file
    // Here we just use authorize for role validation if needed
    next();
};
