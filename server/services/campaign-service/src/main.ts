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
import campaignRoutes from './routes/campaign.routes';
import internalRoutes from './routes/internal.routes';

const app = express();
const server = createServer(app);
const port = config.port;

mongoose.connect(config.mongoUri)
    .then(() => console.log('Connected to MongoDB (Campaign Service)'))
    .catch(err => console.error('MongoDB connection error:', err));

app.use(cors());
app.use(morgan('dev'));
app.use(compression());
app.use(express.json());

app.use('/api/v1/campaigns/internal', internalRoutes);
app.use('/api/v1/campaigns', campaignRoutes);

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'CarBot AI — Campaign Service',
        version: '1.0.0',
        timestamp: new Date()
    });
});

app.get('/api/v1/campaigns/health', (req, res) => {
    res.json({ status: 'OK', service: 'Campaign Service' });
});

server.listen(port, () => {
    console.log(`Campaign Service running on port ${port}`);
});
