import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';
import { sendError } from './response';

export const handleError = (err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error(`Error in ${req.method} ${req.url}:`, err);
    
    // Check if it's a validation error
    if (err.isJoi) {
        return sendError(res, err.details[0].message, 400);
    }

    // Default error
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    
    return sendError(res, message, statusCode);
};
