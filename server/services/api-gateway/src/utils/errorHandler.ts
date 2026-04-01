import { AppError, errorHandler as sharedErrorHandler, asyncHandler as sharedAsyncHandler } from '@carbot/common';
import { logger } from './logger';

export { AppError };

export const createError = (message: string, statusCode: number = 500): AppError => {
    return new AppError(message, statusCode);
};

export const handleError = sharedErrorHandler(logger);

export const asyncHandler = sharedAsyncHandler;

