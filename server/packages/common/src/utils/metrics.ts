import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

// Keep basic metrics gathering for default Node.js data
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

// Expose custom HTTP counter
export const httpRequestsCounter = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
});

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
    res.on('finish', () => {
        httpRequestsCounter.inc({
            method: req.method,
            route: req.route ? req.route.path : req.path,
            status_code: res.statusCode
        });
    });
    next();
};

export const getMetrics = async (req: Request, res: Response) => {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
};
