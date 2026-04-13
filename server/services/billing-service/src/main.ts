import 'reflect-metadata';
import './types';
import './container';
import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import mongoose from 'mongoose';
import routes from './routes';
import { logger } from './utils/logger';

const app = express();
const port = process.env.PORT || 5008;

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/carbot_billing')
    .then(() => logger.info('Connected to MongoDB (Billing Service)'))
    .catch(err => logger.error('MongoDB connection error:', err));

app.use(cors());
app.use(express.json());

// Main Router
app.use('/api/v1', routes);

app.listen(port, () => {
    logger.info(`Billing & Financial Intelligence Service running on port ${port}`);
});
