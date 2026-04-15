import { Request } from 'express';

export enum UserRole {
    CUSTOMER = 'customer',
    PARTNER = 'partner',
    ADMIN = 'admin',
    SUPER_ADMIN = 'super_admin'
}

export interface AppConfig {
    port: number | string;
    env: string;
    mongoUri: string;
    internalSecret: string;
    authServiceUrl: string;
    botServiceUrl: string;
    inventoryServiceUrl: string;
    postgres: {
        host: string;
        port: number;
        username: string;
        password: string;
        database: string;
    };
}

export interface RequestUser {
    userId: string;
    email: string;
    role: string;
    tenantId?: string;
}


export interface AuthenticatedRequest extends Request {
    user?: RequestUser;
}
