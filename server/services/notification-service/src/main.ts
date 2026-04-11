import 'reflect-metadata';
import express from 'express';
import { createServer } from 'http';
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import mongoose from 'mongoose';
import config from './config';
import notificationRoutes from './routes/notification.routes';
import { SocketService } from './services/SocketService';
import { logger } from './utils/logger';

const app = express();
const httpServer = createServer(app);
const port = config.port;

mongoose.connect(config.mongoUri)
    .then(() => logger.info('Connected to MongoDB (Notification Service)'))
    .catch(err => logger.error('MongoDB connection error:', err));

app.use(cors());
app.use(morgan('dev'));
app.use(compression());
app.use(express.json());

// Socket.io Initialization
const socketService = SocketService.getInstance();
socketService.init(httpServer);

app.use('/api/v1/notifications', notificationRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'Notification Service' });
});

httpServer.listen(port, () => {
    logger.info(`Notification Service running on port ${port}`);
});
