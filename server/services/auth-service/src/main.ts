import express from 'express';
import { createServer, Server } from 'http';
import dotenv from 'dotenv';
dotenv.config();
import config from './config';
import 'reflect-metadata';
import { DatabaseConnection } from './config/database';
import { corsMiddleware } from './middleware/cors';
import { securityMiddleware } from './middleware/security';
import { generalLimiter } from './middleware/rateLimit';
import { httpLogger } from './middleware/logging';
import routes from './routes';
import { maintenanceMiddleware } from './middleware/maintenanceMiddleware';
import { handleError } from './utils/errorHandler';
import { logger } from './utils/logger';
import './container/container';
import cookieParser from 'cookie-parser';
import passport from 'passport';

class Application {
    private _app: express.Application;
    private _server: Server;
    private _database: DatabaseConnection;

    constructor() {
        this._app = express();
        this._app.use(passport.initialize());

        this._server = createServer(this._app);
        this._database = DatabaseConnection.getInstance();

        this._initializeMiddlewares();
        this._initializeRoutes();
        this._initializeErrorHandling();
    }

    private _initializeMiddlewares(): void {
        // Security middlewares
        this._app.use(securityMiddleware);
        this._app.use(corsMiddleware);

        // Logging middleware
        this._app.use(httpLogger);

        // Maintenance Mode
        this._app.use(maintenanceMiddleware);

        // Rate limiting
        this._app.use(generalLimiter);

        // Body parsing middleware
        this._app.use(express.json({ limit: config.maxSizeLimit }));
        this._app.use(express.urlencoded({ extended: true, limit: config.maxSizeLimit }));
        this._app.use(cookieParser());

        logger.info('Middlewares initialized');
    }

    private _initializeRoutes(): void {
        // Handle preflight requests for all routes
        this._app.options('*', corsMiddleware);

        // API routes
        this._app.use('/api/v1', routes);

        // Internal service-mesh routes (no JWT, secret-based)

        // Root route
        this._app.get('/', (req, res) => {
            res.json({
                success: true,
                message: 'CarBot AI — Auth Service',
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
            // Connect to database
            await this._database.connect();

            // Start server
            this._server.listen(config.port, () => {
                logger.info(`Server running on port ${config.port} in ${config.env} mode`);
                logger.info(`API available at http://localhost:${config.port}/api/v1`);
            });

            // Graceful shutdown handlers
            this._setupGracefulShutdown();

        } catch (error) {
            logger.error('Failed to start application:', error);
            process.exit(1);
        }
    }

    private _setupGracefulShutdown(): void {
        const gracefulShutdown = async (signal: string) => {
            logger.info(`Received ${signal}. Starting graceful shutdown...`);

            // Close server
            this._server.close(async () => {
                logger.info('HTTP server closed');

                try {
                    // Close database connection
                    await this._database.disconnect();
                    logger.info('Database connection closed');

                    logger.info('Graceful shutdown completed');
                    process.exit(0);
                } catch (error) {
                    logger.error('Error during graceful shutdown:', error);
                    process.exit(1);
                }
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
