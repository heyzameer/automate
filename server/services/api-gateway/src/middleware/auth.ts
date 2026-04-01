import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { sendError } from '../utils/response';
import { RequestUser } from '../types';

/**
 * Middleware to authenticate requests at the Gateway level.
 * Decodes the JWT and attaches user information to the request object.
 * This information can then be used to inject X-Tenant-Id headers.
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // Some routes might be public, but we still try to decode if header present
            return next();
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, config.jwtSecret) as any;

            req.user = {
                userId: decoded.userId,
                email: decoded.email,
                role: decoded.role,
                tenantId: decoded.tenantId,
            } as RequestUser;

            next();
        } catch (jwtError) {
            // If token is invalid, we might want to block or just let the downstream service handle it
            // For a secure gateway, we block.
            return sendError(res, 'Invalid or expired token', 401);
        }
    } catch (error) {
        next(error);
    }
};
