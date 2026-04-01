import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';
import { sendError } from '../utils/response';
import { logger } from '../utils/logger';

export const validate = (schema: Schema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { error } = schema.validate(req.body, { abortEarly: false });

        if (error) {
            logger.warn(`[VALIDATION] ${req.method} ${req.url} - ${error.message}`);
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
            }));

            const errorSummary = errors.map(e => `${e.field}: ${e.message}`).join(', ');
            return sendError(res, `Validation failed: ${errorSummary}`, 400, JSON.stringify(errors));
        }
        next();
    };
};

export const validateParams = (schema: Schema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { error } = schema.validate(req.params, { abortEarly: false });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
            }));
            return sendError(res, 'Parameter validation failed', 400, JSON.stringify(errors));
        }
        next();
    };
};

export const validateQuery = (schema: Schema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { error } = schema.validate(req.query, { abortEarly: false });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
            }));
            return sendError(res, 'Query validation failed', 400, JSON.stringify(errors));
        }
        next();
    };
};
