import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import config from '../config';
import { logger } from '../utils/logger';
import { getRabbitMQ } from '../utils/rabbitmq';

export const kioskGuard = async (req: Request, res: Response, next: NextFunction) => {
    const kioskKey = req.headers['x-kiosk-key'] as string;
    
    // Only apply to inventory public/customer routes
    if (!req.path.startsWith('/inventory/public') && !req.path.startsWith('/inventory/customer')) {
        return next();
    }

    if (!kioskKey) {
        return res.status(401).json({ 
            success: false, 
            message: 'Unauthorized: Kiosk Authorization Key is required for this showroom' 
        });
    }

    try {
        // Validate key with Auth Service internally
        const response = await axios.get(`${config.services.auth}/api/v1/internal/tenants/kiosk/${kioskKey}`, {
            headers: { 'x-internal-secret': config.internalSecret }
        });

        if (response.data.success) {
            const tenant = response.data.data;
            const origin = req.headers.origin;

            // CORS / Domain Verification
            const allowedDomains = tenant.kioskConfig?.allowedDomains || [];
            
            if (allowedDomains.length > 0) {
                const isAllowed = allowedDomains.some((d: string) => d.includes(origin || ''));
                if (!origin || !isAllowed) {
                    logger.warn(`[KIOSK_GUARD] Blocked request from unauthorized origin: ${origin} for tenant ${tenant.name}`);
                    return res.status(403).json({ 
                        success: false, 
                        message: `Forbidden: Origin ${origin || 'Unknown'} is not authorized for this showroom.` 
                    });
                }
            }

            // Set dynamic CORS header for this request
            if (origin) {
                res.setHeader('Access-Control-Allow-Origin', origin);
                res.setHeader('Access-Control-Allow-Credentials', 'true');
            }
            
            // Inject tenantId into request for the downstream service
            if (!req.user) req.user = {} as any;
            req.user!.tenantId = tenant._id || tenant.id;

            // Enforcement: If request already has a tenantId (query/body), it MUST match the kiosk's showroom
            const targetTenantId = req.query.tenantId || req.body.tenantId;
            if (targetTenantId && targetTenantId !== req.user!.tenantId) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Forbidden: This kiosk is only authorized to access data for its specific showroom.' 
                });
            }

            // Also override headers for proxy
            req.headers['x-tenant-id'] = req.user!.tenantId;
            
            // Increment Usage (Async)
            getRabbitMQ().then(mq => {
                mq.publish('carbot_events', 'usage.increment', {
                    tenantId: req.user!.tenantId,
                    service: 'kiosk'
                });
            });

            return next();
        }
    } catch (error: any) {
        const status = error.response?.status || 401;
        const message = error.response?.data?.message || 'Unauthorized: Invalid or inactive Kiosk Authorization Key';
        
        logger.error(`[KIOSK_GUARD] Validation failed: ${message}`);
        return res.status(status).json({ 
            success: false, 
            message 
        });
    }

    return res.status(401).json({ success: false, message: 'Unauthorized' });
};
