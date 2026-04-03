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
    timeout: 120000, // 2 minutes for uploads
    parseReqBody: false, // Fix: Essential for large file uploads and preventing "Unexpected end of form"
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
        } else {
            path = `${PROXY_PATHS.SUPER_ADMIN_API}${req.url}`;
        }
        logger.info(`Proxying to service: ${path}`);
        return path;
    },
    proxyErrorHandler: (err: any, res: Response, next: NextFunction) => {
        logger.error(`[PROXY_ERROR]: ${err.message}`);
        res.status(504).json({
            success: false,
            message: 'Target service timed out or is unavailable'
        });
    }
};

// Apply authentication to all proxied routes EXCLUDING public bot webhooks
router.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith(GATEWAY_ROUTES.BOT)) {
        return next();
    }
    return authenticate(req, res, next);
});

router.use(GATEWAY_ROUTES.AUTH, proxy(config.services.auth, proxyOptions) as any);

router.use(GATEWAY_ROUTES.INVENTORY, proxy(config.services.inventory, proxyOptions) as any);

router.use(GATEWAY_ROUTES.BOT, proxy(config.services.bot, proxyOptions) as any);

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

