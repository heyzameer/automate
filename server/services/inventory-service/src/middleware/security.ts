import helmet from 'helmet';
import compression from 'compression';

export const securityMiddleware = [
    helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        contentSecurityPolicy: false // We are an API
    }),
    compression(),
];
