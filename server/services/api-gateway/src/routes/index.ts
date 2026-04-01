import { Router, Request, Response } from 'express';
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
        const path = req.originalUrl.includes(GATEWAY_ROUTES.AUTH)
            ? `${PROXY_PATHS.AUTH_SERVICE}${req.url}`
            : `${PROXY_PATHS.SUPER_ADMIN_API}${req.url}`;
        logger.info(`Proxying to service: ${path}`);
        return path;
    }
};

// Apply authentication to all proxied routes
router.use(authenticate);

// Proxy to Auth Service
router.use(GATEWAY_ROUTES.AUTH, proxy(config.services.auth, proxyOptions) as any);

// Proxy to Super Admin (which is in Auth Service)
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

