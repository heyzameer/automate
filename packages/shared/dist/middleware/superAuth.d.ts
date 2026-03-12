import { Request, Response, NextFunction } from 'express';
export declare const superAuth: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
