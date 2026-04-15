import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const correlationIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
    let correlationId = req.headers['x-correlation-id'] as string;
    
    if (!correlationId) {
        correlationId = uuidv4();
    }
    
    // Attach to request
    req.headers['x-correlation-id'] = correlationId;
    
    // Attach to response
    res.setHeader('x-correlation-id', correlationId);
    
    next();
};
