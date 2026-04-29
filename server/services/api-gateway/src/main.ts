import express from 'express';
import { createServer } from 'http';
import dotenv from 'dotenv';
dotenv.config();
import config from './config';

import { corsMiddleware } from './middleware/cors';
import { securityMiddleware } from './middleware/security';
import { generalLimiter } from './middleware/rateLimit';
import { httpLogger } from './middleware/logging';
import routes from './routes';
import { maintenanceMiddleware } from './middleware/maintenanceMiddleware';
import { handleError } from './utils/errorHandler';
import { logger } from './utils/logger';
import { Server } from 'http';
import cookieParser from 'cookie-parser';

class Application {
    private _app: express.Application;
    private _server: Server;

    constructor() {
        this._app = express();
        this._app.set('trust proxy', true);
        this._server = createServer(this._app);

        this._initializeMiddlewares();
        this._initializeRoutes();
        this._initializeErrorHandling();
    }

    private _initializeMiddlewares(): void {
        // Security middlewares
        this._app.use(securityMiddleware);
        this._app.use(corsMiddleware);

        // Request correlation
        const { correlationIdMiddleware } = require('./middleware/correlationId');
        this._app.use(correlationIdMiddleware);

        // Metrics middleware
        const { metricsMiddleware, correlationContextMiddleware } = require('@carbot/common');
        this._app.use(metricsMiddleware);
        this._app.use(correlationContextMiddleware);

        // Logging middleware
        this._app.use(httpLogger);

        // Maintenance Mode
        this._app.use(maintenanceMiddleware);

        // Rate limiting
        this._app.use(generalLimiter);

        // Required for reading auth cookies if applicable
        this._app.use(cookieParser());

        logger.info('Middlewares initialized');
    }

    private _initializeRoutes(): void {
        // Handle preflight requests for all routes
        this._app.options('*', corsMiddleware);

        // Metrics route
        const { getMetrics } = require('@carbot/common');
        this._app.get('/metrics', getMetrics);

        // API routes
        this._app.use('/api/v1', routes);

        // Root route
        this._app.get('/', (req, res) => {
            res.json({
                success: true,
                message: 'CarBot AI Gateway API',
                version: '1.0.0',
                timestamp: new Date(),
                docs: '/api/v1/health',
            });
        });

        logger.info('Routes initialized');
    }

    private _initializeErrorHandling(): void {
        // Global error handler
        this._app.use(handleError);

        logger.info('Error handling initialized');
    }

    public async start(): Promise<void> {
        try {
            // Start server
            this._server.listen(config.port, async () => {
                logger.info(`Gateway running on port ${config.port} in ${config.env} mode`);
                logger.info(`Gateway available at http://localhost:${config.port}/api/v1`);
                
                // Init RabbitMQ
                try {
                    const { getRabbitMQ } = await import('./utils/rabbitmq');
                    await getRabbitMQ();
                } catch (e) {
                    logger.error('Failed to init RabbitMQ in Gateway', e);
                }
            });

            // Graceful shutdown handlers
            this._setupGracefulShutdown();

        } catch (error) {
            logger.error('Failed to start gateway:', error);
            process.exit(1);
        }
    }

    private _setupGracefulShutdown(): void {
        const gracefulShutdown = async (signal: string) => {
            logger.info(`Received ${signal}. Starting graceful shutdown...`);

            // Close server
            this._server.close(async () => {
                logger.info('HTTP server closed');
                logger.info('Graceful shutdown completed');
                process.exit(0);
            });
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception:', error);
            process.exit(1);
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
            process.exit(1);
        });
    }
}

// Start the application
const application = new Application();
application.start();
