export const ROUTES = {
  LANDING: '/',
  ADMIN_LANDING: '/admin',
  ADMIN_LOGIN: '/admin-login',
  HOME: '/app',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  REGISTER_SUCCESS: '/registration-success',
  
  DASHBOARD: {
    HOME: '/dashboard',
    SUBSCRIPTION: '/subscription',
    SETTINGS: '/settings',
    NOTIFICATIONS: '/notifications',
  },
  
  VEHICLES: {
    BASE: '/vehicles',
    ADD: '/vehicles/add',
    DETAIL: (id: string) => `/vehicles/${id}`,
  },
  
  ENQUIRIES: {
    LEADS: '/leads',
    BOOKINGS: '/bookings',
  },
  
  AUTOMATION: {
    WHATSAPP: '/automation',
  },

  MARKETING: {
    CAMPAIGNS: '/campaigns',
  },
  
  SUPER_ADMIN: {
    BASE: '/super',
    DASHBOARD: '/super/dashboard',
    SHOWROOMS: '/super/showrooms',
    SHOWROOM_DETAIL: (id: string) => `/super/showrooms/${id}`,
    FORM_BUILDER: '/super/form-builder',
    INVENTORY_CONFIG: '/super/inventory-config',
    WA_CONFIG: '/super/wa-config',
    KIOSK_CONFIG: '/super/kiosk-config',
    USAGE_ANALYTICS: '/super/usage-analytics',
    SETTINGS: '/super/settings',
  }
} as const;
