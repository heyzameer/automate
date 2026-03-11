import { Router, Request, Response } from 'express';
import authRoutes from './authRoutes';
import { sendSuccess } from '../utils/response';

const router = Router();

// Health check route
router.get('/health', (req: Request, res: Response) => {
    sendSuccess(res, 'Service is healthy', {
        status: 'OK',
        timestamp: new Date(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
    });
});

// API version info
router.get('/version', (req: Request, res: Response) => {
    sendSuccess(res, 'API version information', {
        version: '1.0.0',
        apiVersion: 'v1',
        name: 'Backend Template API',
        description: 'Core backend API with Auth and RBAC',
    });
});

// Mount module routes
router.use('/auth', authRoutes);

// API Root
router.get('/', (req: Request, res: Response) => {
    sendSuccess(res, 'Travel Hub API v1', {
        version: '1.0.0',
        status: 'Operational',
        docs: '/api/v1/health',
    });
});

// 404 handler for API routes
router.use('*', (req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found',
        timestamp: new Date(),
    });
});

export default router;
