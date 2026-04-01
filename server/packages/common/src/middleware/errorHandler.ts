import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/response';

export const errorHandler = (logger: any) => {
  return (err: any, req: Request, res: Response, next: NextFunction) => {
    let { statusCode, message } = err;

    if (!(err instanceof AppError)) {
      statusCode = err.statusCode || 500;
      message = err.message || 'Internal Server Error';
    }

    // Log the error
    logger.error(`${req.method} ${req.url} - ${statusCode} - ${message}`, {
      stack: err.stack,
      body: req.body,
      params: req.params,
      query: req.query,
    });

    // Special handling for Mongoose validation/duplicate errors if needed
    if (err.name === 'ValidationError') {
      statusCode = 400;
      message = Object.values(err.errors).map((val: any) => val.message).join(', ');
    }
    
    if (err.code === 11000) {
      statusCode = 409;
      const field = Object.keys(err.keyValue)[0];
      message = `Duplicate field value: ${field}. Please use another value!`;
    }

    sendError(res, message, statusCode, process.env.NODE_ENV === 'development' ? err.stack : undefined);
  };
};
