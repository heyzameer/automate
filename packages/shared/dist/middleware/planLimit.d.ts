import { Request, Response, NextFunction } from 'express';
export declare const planLimit: (countFn: (tenantId: string) => Promise<number>, limitKey: "maxCars" | "maxLeads") => (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
