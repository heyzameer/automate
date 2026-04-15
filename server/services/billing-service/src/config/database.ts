import mongoose from 'mongoose';
import config from './index';
import { logger } from '../utils/logger';

export const connectDatabase = async () => {
    try {
        await mongoose.connect(config.mongoUri);
        logger.info('Connected to MongoDB (Billing Service)');
    } catch (error) {
        logger.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    }
};
