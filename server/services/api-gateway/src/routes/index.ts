import { Router, Request, Response, NextFunction } from 'express';
import proxy from 'express-http-proxy';
import config from '../config';
import { sendSuccess } from '../utils/response';
import { logger } from '../utils/logger';
import { GATEWAY_ROUTES, PROXY_PATHS } from '../constants/routes';
import { authenticate } from '../middleware/auth';

const router = Router();

// Health check route
router.get(GATEWAY_ROUTES.HEALTH, (req: Request, res: Response) => {
    sendSuccess(res, 'Gateway is healthy', {
        status: 'OK',
        timestamp: new Date(),
        uptime: process.uptime(),
        environment: config.env,
    });
});

// Middleware to inject headers for microservices
const proxyOptions = {
    timeout: 30000, // 30 seconds
    proxyReqOptDecorator: (proxyReqOpts: any, srcReq: Request) => {
        if (srcReq.user) {
            proxyReqOpts.headers['X-User-Id'] = srcReq.user.userId;
            proxyReqOpts.headers['X-User-Email'] = srcReq.user.email;
            proxyReqOpts.headers['X-User-Role'] = srcReq.user.role;
            if (srcReq.user.tenantId) {
                proxyReqOpts.headers['X-Tenant-Id'] = srcReq.user.tenantId;
            }
        }
        return proxyReqOpts;
    },
    proxyReqPathResolver: (req: Request) => {
        let path = '';
        if (req.originalUrl.includes(GATEWAY_ROUTES.AUTH)) {
            path = `${PROXY_PATHS.AUTH_SERVICE}${req.url}`;
        } else if (req.originalUrl.includes(GATEWAY_ROUTES.INVENTORY)) {
            path = `${PROXY_PATHS.INVENTORY_SERVICE}${req.url}`;
        } else if (req.originalUrl.includes(GATEWAY_ROUTES.BOT)) {
            path = `${PROXY_PATHS.BOT_SERVICE}${req.url}`;
        } else if (req.originalUrl.includes(GATEWAY_ROUTES.CAMPAIGN)) {
            path = `${PROXY_PATHS.CAMPAIGN_SERVICE}${req.url}`;
        } else if (req.originalUrl.includes(GATEWAY_ROUTES.NOTIFICATION)) {
            path = `${PROXY_PATHS.NOTIFICATION_SERVICE}${req.url}`;
        } else if (req.originalUrl.includes(GATEWAY_ROUTES.ANALYTICS)) {
            path = `${PROXY_PATHS.ANALYTICS_SERVICE}${req.url}`;
        } else if (req.originalUrl.includes(GATEWAY_ROUTES.BILLING)) {
            path = `${PROXY_PATHS.BILLING_SERVICE}${req.url}`;
        } else if (req.originalUrl.includes(GATEWAY_ROUTES.SUPER_ADMIN)) {
            path = `${PROXY_PATHS.SUPER_ADMIN_API}${req.url}`;
        } else {
            path = `${PROXY_PATHS.SUPER_ADMIN_API}${req.url}`;
        }
        
        // DEBUG: Log the final resolving path to catch 404 mismatches
        const finalPath = path.replace(/\/+/g, '/'); // Sanitize double slashes
        logger.info(`[GATEWAY PROXY] ${req.method} ${req.originalUrl} -> ${finalPath}`);
        
        return finalPath;
    },
    proxyErrorHandler: (err: any, res: Response, next: NextFunction) => {
        logger.error(`[PROXY_ERROR]: ${err.message || 'Unknown error'}`, { error: err });
        if (err && err.code === 'ECONNREFUSED') {
            return res.status(503).json({ success: false, message: 'Target service unavailable' });
        }
        res.status(504).json({
            success: false,
            message: 'Target service timed out or is unavailable'
        });
    }
};

// Apply authentication to all proxied routes EXCLUDING public bot webhooks and public inventory
router.use((req: Request, res: Response, next: NextFunction) => {
    // 1. Bot Webhooks and Public Capture/Scan are always public
    if (req.path.startsWith('/bot/webhooks') || req.path.startsWith('/bot/public')) {
        return next();
    }
    
    // 2. Inventory Public catalog is always public
    if (req.path.startsWith(`${GATEWAY_ROUTES.INVENTORY}/public`)) {
        return next();
    }
    
    return authenticate(req, res, next);
});

router.use(GATEWAY_ROUTES.AUTH, proxy(config.services.auth, proxyOptions) as any);

router.use(GATEWAY_ROUTES.INVENTORY, proxy(config.services.inventory, proxyOptions) as any);

router.use(GATEWAY_ROUTES.BOT, proxy(config.services.bot, proxyOptions) as any);

router.use(GATEWAY_ROUTES.CAMPAIGN, proxy(config.services.campaign, proxyOptions) as any);
router.use(GATEWAY_ROUTES.NOTIFICATION, proxy(config.services.notification, proxyOptions) as any);
router.use(GATEWAY_ROUTES.ANALYTICS, proxy(config.services.analytics, proxyOptions) as any);
router.use(GATEWAY_ROUTES.BILLING, proxy(config.services.billing, proxyOptions) as any);
router.use(GATEWAY_ROUTES.SUPER_ADMIN, proxy(config.services.auth, proxyOptions) as any);

// API Root
router.get(GATEWAY_ROUTES.ROOT, (req: Request, res: Response) => {
    sendSuccess(res, 'CarBot AI Gateway v1', {
        version: '1.0.0',
        status: 'Operational',
        services: {
            auth: 'connected'
        }
    });
});

// 404 handler
router.use(GATEWAY_ROUTES.WILDCARD, (req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: 'Gateway endpoint not found',
        timestamp: new Date(),
    });
});

export default router;

