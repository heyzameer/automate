import 'reflect-metadata';
import './container';
import express from 'express';
import cors from 'cors';
import routes from './routes';
import { logger } from './utils/logger';
import { connectDatabase } from './config/database';
import config from './config';

const app = express();
const port = config.port;

connectDatabase();

app.use(cors());
app.use(express.json());

// Main Router
app.use('/api/v1', routes);

app.listen(port, () => {
    logger.info(`Billing & Financial Intelligence Service running on port ${port}`);
});
