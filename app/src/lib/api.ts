import axios from 'axios';
import { API_ENDPOINTS } from '../constants/endpoints';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept responses to handle errors or refresh token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute = 
      error.config?.url?.includes(API_ENDPOINTS.AUTH.LOGIN) || 
      error.config?.url?.includes(API_ENDPOINTS.AUTH.SUPER_LOGIN) ||
      error.config?.url?.includes(API_ENDPOINTS.AUTH.REGISTER_TENANT);

    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Use window.location as we are outside of React routing context here
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    if (error.response?.status === 403) {
      console.error('Forbidden access attempt detected');
      // Optionally handle specific 403 scenarios
    }

    return Promise.reject(error);
  }
);

export default api;
