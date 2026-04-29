export const GATEWAY_ROUTES = {
    ROOT: '/',
    HEALTH: '/health',
    AUTH: '/auth',
    INVENTORY: '/inventory',
    BOT: '/bot',
    CAMPAIGN: '/campaigns',
    NOTIFICATION: '/notifications',
    ANALYTICS: '/analytics',
    BILLING: '/billing',
    SUPER_ADMIN: '/super',
    WILDCARD: '*',
} as const;

export const PROXY_PATHS = {
    AUTH_SERVICE: '/api/v1/auth',
    INVENTORY_SERVICE: '/api/v1/inventory',
    BOT_SERVICE: '/api/v1/bot',
    CAMPAIGN_SERVICE: '/api/v1/bot/campaigns',
    NOTIFICATION_SERVICE: '/api/v1/notifications',
    ANALYTICS_SERVICE: '/api/v1/analytics',
    BILLING_SERVICE: '/api/v1/billing',
    SUPER_ADMIN_API: '/api/v1/super',
} as const;
