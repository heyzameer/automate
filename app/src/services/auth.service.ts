import api from '../lib/api';
import { API_ENDPOINTS } from '../constants/endpoints';
import { User } from '../types';

export interface LoginPayload {
  email?: string;
  password?: string;
}

export interface AuthTenant {
  name: string;
  plan?: string;
  limits?: { maxCars?: number; maxLeads?: number };
  expiryDate: string;
  isActive: boolean;
  [key: string]: unknown;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export const authService = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await api.post(API_ENDPOINTS.AUTH.LOGIN, payload);
    return data.data;
  },

  superLogin: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await api.post(API_ENDPOINTS.AUTH.SUPER_LOGIN, payload);
    return data.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getStoredUser: (): User | null => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  },
  
  getStoredToken: (): string | null => {
    return localStorage.getItem('token');
  },

  getMyTenant: async (): Promise<{ tenant?: AuthTenant }> => {
    const { data } = await api.get(API_ENDPOINTS.AUTH.MY_TENANT);
    return data.data;
  },

  updateProfile: async (payload: Partial<User>): Promise<User> => {
    const { data } = await api.patch(API_ENDPOINTS.AUTH.PROFILE, payload);
    if (data.data?.user) {
        localStorage.setItem('user', JSON.stringify(data.data.user));
    }
    return data.data?.user || data.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await api.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, { currentPassword, newPassword });
  },
};
