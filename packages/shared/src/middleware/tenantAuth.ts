import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const tenantAuth = (jwtSecret: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ success: false, message: 'Authorization token required' });
            }

            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, jwtSecret) as any;

            if (!decoded.tenantId && decoded.role !== 'super_admin') {
                return res.status(403).json({ success: false, message: 'Tenant ID missing in token' });
            }

            // Attach to request
            req.user = decoded;
            
            // In a real microservice, we might want to check if the tenant is still active in a cache (like Redis)
            // For now, we assume the token is valid if not expired.
            // Expiry check is handled by jwt.verify.

            next();
        } catch (error) {
            return res.status(401).json({ success: false, message: 'Invalid or expired token' });
        }
    };
};
