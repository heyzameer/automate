import 'reflect-metadata';
import express from 'express';
import { createServer, Server } from 'http';
import dotenv from 'dotenv';
dotenv.config();
import config from './config';
import './container';
import { container } from 'tsyringe';
import { DatabaseConnection } from './config/database';
import { corsMiddleware } from './middleware/cors';
import { securityMiddleware } from './middleware/security';
import { generalLimiter } from './middleware/rateLimit';
import { httpLogger } from './middleware/logging';
import routes from './routes';
import internalRoutes from './routes/internal.routes';
import { maintenanceMiddleware } from './middleware/maintenanceMiddleware';
import { handleError } from './utils/errorHandler';
import { logger } from './utils/logger';
import cookieParser from 'cookie-parser';

import { AlertService } from './services/AlertService';
import { SearchService } from './services/SearchService';

class Application {
    private _app: express.Application;
    private _server: Server;
    private _database: DatabaseConnection;

    constructor() {
        this._app = express();
        this._server = createServer(this._app);
        this._database = DatabaseConnection.getInstance();

        this._initializeMiddlewares();
        this._initializeRoutes();
        this._initializeErrorHandling();
        this._initializeServices();
    }

    private _initializeServices(): void {
        const alertService = container.resolve(AlertService);
        alertService.initialize();
    }

    private _initializeMiddlewares(): void {
        this._app.use(securityMiddleware);
        this._app.use(corsMiddleware);
        this._app.use(httpLogger);
        this._app.use(maintenanceMiddleware);
        this._app.use(generalLimiter);
        // Body parsing middleware - skip for multipart to let multer handle streams
        this._app.use((req, res, next) => {
            if (req.headers['content-type']?.includes('multipart/form-data')) {
                return next();
            }
            return express.json({ limit: config.maxSizeLimit })(req, res, next);
        });
        this._app.use((req, res, next) => {
            if (req.headers['content-type']?.includes('multipart/form-data')) {
                return next();
            }
            return express.urlencoded({ extended: true, limit: config.maxSizeLimit })(req, res, next);
        });
        this._app.use(cookieParser());
        logger.info('Middlewares initialized');
    }

    private _initializeRoutes(): void {
        this._app.options('*', corsMiddleware);
        this._app.use('/api/v1/inventory', routes);
        this._app.use('/internal', internalRoutes);

        this._app.get('/', (req, res) => {
            res.json({
                success: true,
                message: 'CarBot AI — Inventory Service',
                version: '1.0.0',
                timestamp: new Date()
            });
        });
        logger.info('Routes initialized');
    }

    private _initializeErrorHandling(): void {
        this._app.use(handleError);
        logger.info('Error handling initialized');
    }

    public async start(): Promise<void> {
        try {
            await this._database.connect();
            
            // Wait for Search Engine and initialize RabbitMQ consumers
            const mq = await import('./utils/rabbitmq');
            await mq.getRabbitMQ();
            
            this._server.listen(config.port, () => {
                logger.info(`Inventory Service running on port ${config.port}`);
            });
            this._setupGracefulShutdown();
        } catch (error) {
            logger.error('Failed to start Inventory Service:', error);
            process.exit(1);
        }
    }

    private _setupGracefulShutdown(): void {
        const gracefulShutdown = async (signal: string) => {
            logger.info(`Received ${signal}. Starting graceful shutdown...`);
            this._server.close(async () => {
                logger.info('HTTP server closed');
                try {
                    await this._database.disconnect();
                    logger.info('Database connection closed');
                    process.exit(0);
                } catch (error) {
                    logger.error('Error during graceful shutdown:', error);
                    process.exit(1);
                }
            });
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception:', error);
            process.exit(1);
        });
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
            process.exit(1);
        });
    }
}

const application = new Application();
application.start();
