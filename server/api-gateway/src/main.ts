import express from 'express';
import { createServer } from 'http';
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
import { container } from 'tsyringe';
import './container/container';
import cookieParser from 'cookie-parser';
import passport from 'passport';

class Application {
    private app: express.Application;
    private server: any;
    private database: DatabaseConnection;

    constructor() {
        this.app = express();
        this.app.use(passport.initialize());

        this.server = createServer(this.app);
        this.database = DatabaseConnection.getInstance();

        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }

    private initializeMiddlewares(): void {
        // Security middlewares
        this.app.use(securityMiddleware);
        this.app.use(corsMiddleware);

        // Logging middleware
        this.app.use(httpLogger);

        // Maintenance Mode
        this.app.use(maintenanceMiddleware);

        // Rate limiting
        this.app.use(generalLimiter);

        // Body parsing middleware
        this.app.use(express.json({ limit: config.maxSizeLimit }));
        this.app.use(express.urlencoded({ extended: true, limit: config.maxSizeLimit }));
        this.app.use(cookieParser());

        logger.info('Middlewares initialized');
    }

    private initializeRoutes(): void {
        // Handle preflight requests for all routes
        this.app.options('*', corsMiddleware);

        // API routes
        this.app.use('/api/v1', routes);

        // Root route
        this.app.get('/', (req, res) => {
            res.json({
                success: true,
                message: 'Backend Template API',
                version: '1.0.0',
                timestamp: new Date(),
                docs: '/api/v1/health',
            });
        });

        logger.info('Routes initialized');
    }

    private initializeErrorHandling(): void {
        // Global error handler
        this.app.use(handleError);

        logger.info('Error handling initialized');
    }

    public async start(): Promise<void> {
        try {
            // Connect to database
            await this.database.connect();

            // Start server
            this.server.listen(config.port, () => {
                logger.info(`Server running on port ${config.port} in ${config.env} mode`);
                logger.info(`API available at http://localhost:${config.port}/api/v1`);
            });

            // Graceful shutdown handlers
            this.setupGracefulShutdown();

        } catch (error) {
            logger.error('Failed to start application:', error);
            process.exit(1);
        }
    }

    private setupGracefulShutdown(): void {
        const gracefulShutdown = async (signal: string) => {
            logger.info(`Received ${signal}. Starting graceful shutdown...`);

            // Close server
            this.server.close(async () => {
                logger.info('HTTP server closed');

                try {
                    // Close database connection
                    await this.database.disconnect();
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
