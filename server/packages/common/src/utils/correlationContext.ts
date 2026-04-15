import { Request, Response, NextFunction } from 'express';
// We must import the async-hooks context from wherever the logger exposes it
// But logger is in @carbot/logger, and @carbot/common uses @carbot/logger
// We can import loggerContext directly from @carbot/logger
import { loggerContext } from '@carbot/logger';

export const correlationContextMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const correlationId = req.headers['x-correlation-id'] as string;
    
    // Create a new context map for the request lifecycle
    const store = new Map<string, string>();
    if (correlationId) {
        store.set('correlationId', correlationId);
    }

    // Run the request inside the AsyncLocalStorage scope
    loggerContext.run(store, () => {
        next();
    });
};
