import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, LoginPayload } from '../services/auth.service';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const authenticate = async (payload: LoginPayload, isSuperAdmin: boolean) => {
    setLoading(true);
    setError('');

    try {
      const { user, accessToken } = isSuperAdmin 
        ? await authService.superLogin(payload)
        : await authService.login(payload);

      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(user));

      toast.success(`Welcome back, ${user.fullName.split(' ')[0]}!`);
      
      if (user.role === 'super_admin') {
        navigate('/super/dashboard');
      } else {
        navigate('/dashboard');
      }
      return true;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      const message = e.response?.data?.message || 'Login failed. Check your credentials.';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    navigate('/login');
  };

  const checkAuth = () => {
    const user = authService.getStoredUser();
    const token = authService.getStoredToken();
    
    if (user && token) {
      if (user.role === 'super_admin') {
        navigate('/super/dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  };

  return {
    loading,
    error,
    setError,
    authenticate,
    logout,
    checkAuth,
    getStoredUser: authService.getStoredUser,
    getStoredToken: authService.getStoredToken
  };
};
