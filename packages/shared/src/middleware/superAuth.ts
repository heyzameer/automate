import { Request, Response, NextFunction } from 'express';

export const superAuth = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== 'super_admin') {
        return res.status(403).json({ success: false, message: 'Super admin access required' });
    }
    next();
};
