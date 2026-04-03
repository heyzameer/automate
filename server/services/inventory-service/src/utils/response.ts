import { Response } from 'express';
import { sendSuccess as commonSuccess, sendError as commonError } from '@carbot/common';

export const sendSuccess = (res: Response, message: string, data?: any, statusCode = 200) => {
    return commonSuccess(res, message, data, statusCode);
};

export const sendError = (res: Response, message: string, statusCode = 500, error?: any) => {
    return commonError(res, message, statusCode, error);
};
