export enum UserRole {
    CUSTOMER = 'customer',
    PARTNER = 'partner',
    ADMIN = 'admin',
    SUPER_ADMIN = 'super_admin'
}

export interface AppConfig {
    port: number | string;
    env: string;
    database: {
        authUri: string;
        inventoryUri: string;
        options: any;
    };
    whatsapp: {
        verifyToken: string;
        apiVersion: string;
        appSecret?: string;
        systemToken?: string;
    };
    gemini: {
        apiKey: string;
    };
    maxSizeLimit: string;
    logs: {
        level: string;
        directory: string;
        maxSize: string;
        maxFiles: string;
    };
    internalSecret: string;
}

export interface RequestUser {
    userId: string;
    email: string;
    role: UserRole;
    tenantId?: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: RequestUser;
        }
    }
}
