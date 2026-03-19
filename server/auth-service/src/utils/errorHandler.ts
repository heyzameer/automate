import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../types';
import { logger } from './logger';
import config from '../config';
import { Server } from 'http'; // Added import for Server

export class AppError extends Error implements CustomError {
    statusCode: number;
    isOperational: boolean;
    data?: unknown;

    constructor(message: string, statusCode: number, data?: unknown) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.data = data;

        Error.captureStackTrace(this, this.constructor);
    }
}

export const createError = (message: string, statusCode: number = 500): AppError => {
    return new AppError(message, statusCode);
};

export const handleError = (error: CustomError, req: Request, res: Response, _next: NextFunction) => {
    const statusCode = error.statusCode || 500;
    let message = error.message;

    // Log error
    logger.error(`Error ${statusCode}: ${message}`, {
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
    });

    // Special handling for MongoDB duplicate key error
    if ((error as any).code === 11000) {
        const field = Object.keys((error as any).keyValue)[0];
        message = `Unique constraint failed: ${field} already exists.`;
        res.status(409).json({
            success: false,
            message,
            timestamp: new Date(),
        });
        return;
    }

    // Don't leak error details in production
    if (config.env === 'production' && !error.isOperational) {
        message = 'Something went wrong!';
    }

    res.status(statusCode).json({
        message,
        data: (error as any).data,
        timestamp: new Date(),
        ...(config.env === 'development' && { stack: error.stack }),
    });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const asyncHandler = (fn: (...args: any[]) => any) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
