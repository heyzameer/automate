export const GATEWAY_ROUTES = {
    ROOT: '/',
    HEALTH: '/health',
    AUTH: '/auth',
    INVENTORY: '/inventory',
    BOT: '/bot',
    SUPER_ADMIN: '/super',
    WILDCARD: '*',
} as const;

export const PROXY_PATHS = {
    AUTH_SERVICE: '/api/v1/auth',
    INVENTORY_SERVICE: '/api/v1/inventory',
    BOT_SERVICE: '/api/v1/bot',
    SUPER_ADMIN_API: '/api/v1/super',
} as const;
