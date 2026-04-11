export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  SHOWROOM_ADMIN = 'showroom_admin',
  SHOWROOM_STAFF = 'showroom_staff',
  CUSTOMER = 'customer',
}

export interface User {
  id: string;
  _id?: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  tenantId?: string;
  isActive: boolean;
}

export interface Tenant {
  id: string;
  _id?: string;
  name: string;
  slug: string;
  plan: 'BASIC' | 'PRO' | 'ENTERPRISE';
  isActive: boolean;
  expiryDate: string;
  limits: {
    maxCars: number;
    maxLeads: number;
  };
  whatsappConfig?: {
    phoneNumberId?: string;
    accessToken?: string;
    verifyToken?: string;
    botEnabled: boolean;
    greetingMessage: string;
    includeGallery: boolean;
    includeSpecs: boolean;
    includeLocation: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
