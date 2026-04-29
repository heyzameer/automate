import 'reflect-metadata';
import express from 'express';
import { createServer, Server } from 'http';
import dotenv from 'dotenv';
dotenv.config();
import config from './config';
import './container';
import { DatabaseConnection } from './config/database';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { logger } from './utils/logger';
import routes from './routes';

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
    }

    private _initializeMiddlewares(): void {
        this._app.use(cors());
        this._app.use(morgan('dev'));
        this._app.use(compression());
        this._app.use(express.json({ 
            limit: config.maxSizeLimit,
            verify: (req: any, res, buf) => {
                req.rawBody = buf;
            }
        }));
        this._app.use(express.urlencoded({ extended: true, limit: config.maxSizeLimit }));
        this._app.use(cookieParser());
        logger.info('Middlewares initialized');
    }

    private _initializeRoutes(): void {
        this._app.use('/api/v1/bot', routes);
        
        this._app.get('/', (req, res) => {
            res.json({
                success: true,
                message: 'CarBot AI — WhatsApp Bot Service',
                version: '1.0.0',
                timestamp: new Date()
            });
        });
        logger.info('Routes initialized');
    }

    private _initializeErrorHandling(): void {
        this._app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
            logger.error('Unhandled error:', err);
            res.status(err.status || 500).json({
                success: false,
                message: err.message || 'Internal Server Error',
            });
        });
        logger.info('Error handling initialized');
    }

    public async start(): Promise<void> {
        try {
            await this._database.connect();
            this._server.listen(config.port, async () => {
                logger.info(`WhatsApp Bot Service running on port ${config.port}`);
                
                // Init RabbitMQ
                try {
                    const { getRabbitMQ } = await import('./utils/rabbitmq');
                    await getRabbitMQ();
                } catch (e) {
                    logger.error('Failed to init RabbitMQ in Bot Service', e);
                }
            });
        } catch (error) {
            logger.error('Failed to start WhatsApp Bot Service:', error);
            process.exit(1);
        }
    }
}

const application = new Application();
application.start();
