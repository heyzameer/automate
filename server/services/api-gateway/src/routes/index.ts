import { Router, Request, Response, NextFunction } from 'express';
import proxy from 'express-http-proxy';
import config from '../config';
import { sendSuccess } from '../utils/response';
import { logger } from '../utils/logger';
import { GATEWAY_ROUTES, PROXY_PATHS } from '../constants/routes';
import { authenticate } from '../middleware/auth';
import { kioskGuard } from '../middleware/kioskGuard';

const router = Router();

// DEBUG: Log all incoming requests to Gateway
router.use((req, res, next) => {
    logger.info(`[GATEWAY RECV] ${req.method} ${req.originalUrl} (Path: ${req.path})`);
    next();
});

const usageTracker = async (req: Request, res: Response, next: NextFunction) => {
    // Only track if we have a tenantId (either from session or kioskGuard)
    const tenantId = req.headers['x-tenant-id'] || (req.user as any)?.tenantId;
    
    if (tenantId) {
        let service: string | null = null;
        if (req.originalUrl.includes(GATEWAY_ROUTES.INVENTORY)) service = 'inventory';
        else if (req.originalUrl.includes(GATEWAY_ROUTES.BOT)) service = 'bot';

        if (service) {
            import('../utils/rabbitmq').then(m => m.getRabbitMQ()).then(mq => {
                mq.publish('carbot_events', 'usage.increment', {
                    tenantId,
                    service
                });
            });
        }
    }
    next();
};

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
    timeout: 120000, // 120 seconds (2 minutes) for high-quality image uploads
    limit: '50mb', // Increase proxy body limit to 50MB to allow large image uploads
    proxyReqOptDecorator: (proxyReqOpts: any, srcReq: Request) => {
        if (srcReq.user) {
            if (srcReq.user.userId) proxyReqOpts.headers['X-User-Id'] = srcReq.user.userId;
            if (srcReq.user.email) proxyReqOpts.headers['X-User-Email'] = srcReq.user.email;
            if (srcReq.user.role) proxyReqOpts.headers['X-User-Role'] = srcReq.user.role;
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

// Apply authentication to all proxied routes EXCLUDING public bot webhooks, public inventory, and public auth routes
router.use((req: Request, res: Response, next: NextFunction) => {
    // Priority Check: Public Kiosk Info (Log this to debug)
    if (req.originalUrl.includes('/customer/kiosk-info')) {
        logger.info(`[GATEWAY_AUTH] Allowing public kiosk route: ${req.originalUrl}`);
        return next();
    }

    // 1. Bot Webhooks and Public Capture/Scan are always public
    if (req.path.startsWith('/bot/webhooks') || req.path.startsWith('/bot/public')) {
        return next();
    }
    
    // 2. Inventory Public catalog and metadata are always public
    if (req.path.startsWith(`${GATEWAY_ROUTES.INVENTORY}/public`) || 
        req.path.startsWith(`${GATEWAY_ROUTES.INVENTORY}/brands`) ||
        req.path.startsWith(`${GATEWAY_ROUTES.INVENTORY}/dropdown`)) {
        return next();
    }

    // 3. Auth public routes (login, register, forgot-password, etc.)
    const publicAuthRoutes = [
        '/register', '/register-tenant', '/login', '/super-login', 
        '/forgot-password', '/reset-password', '/refresh-token',
        '/customer/auth', // Kiosk Customer OTP Login
        '/customer/kiosk-info' // Public Showroom Information
    ];
    if (req.originalUrl.includes(GATEWAY_ROUTES.AUTH)) {
        const isPublicAuth = publicAuthRoutes.some(route => req.originalUrl.includes(route));
        if (isPublicAuth) {
            return next();
        }
    }
    
    return authenticate(req, res, next);
});

router.use(kioskGuard);
router.use(usageTracker);

router.use(GATEWAY_ROUTES.AUTH, proxy(config.services.auth, proxyOptions) as any);

router.use(GATEWAY_ROUTES.INVENTORY, proxy(config.services.inventory, proxyOptions) as any);

router.use(GATEWAY_ROUTES.BOT, proxy(config.services.bot, proxyOptions) as any);

router.use(GATEWAY_ROUTES.CAMPAIGN, proxy(config.services.bot, proxyOptions) as any);
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

