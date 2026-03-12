import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Car, 
  Mail, 
  Lock, 
  ShieldCheck, 
  ArrowRight, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

const Login = () => {
    const [isAdminLogin, setIsAdminLogin] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [fieldErrors, setFieldErrors] = useState<any>({});
    
    const { loading, error, setError, authenticate, checkAuth } = useAuth();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const validate = () => {
        const errors: any = {};
        if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Valid email is required';
        }
        if (!formData.password) {
            errors.password = 'Password is required';
        }
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (error) setError('');
        if (fieldErrors[name]) {
            setFieldErrors({ ...fieldErrors, [name]: '' });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        
        const success = await authenticate(formData, isAdminLogin);
        if (!success) {
            setFormData(prev => ({ ...prev, password: '' }));
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <Toaster position="top-right" />
            
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center mb-6">
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`p-3 rounded-2xl shadow-xl transition-colors duration-500 ${
                            isAdminLogin ? 'bg-slate-900 shadow-slate-200' : 'bg-indigo-600 shadow-indigo-100'
                        }`}
                    >
                        {isAdminLogin ? <ShieldCheck className="text-white h-8 w-8" /> : <Car className="text-white h-8 w-8" />}
                    </motion.div>
                </div>
                
                <h2 className="text-center text-3xl font-black tracking-tight text-slate-900">
                    {isAdminLogin ? 'Super Admin Portal' : 'Showroom Partner'}
                </h2>
                <p className="mt-2 text-center text-sm text-slate-500 font-medium">
                    {isAdminLogin 
                        ? 'System-wide governance & tenant management' 
                        : 'Manage your dealership inventory and leads'
                    }
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-10 px-6 shadow-2xl shadow-slate-200 rounded-3xl border border-slate-100 sm:px-12 relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-slate-50 rounded-full blur-3xl opacity-50"></div>
                    
                    <form className="space-y-6 relative z-10" onSubmit={handleSubmit}>
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-center gap-2 text-rose-600 text-xs font-bold"
                            >
                                <AlertCircle size={14} />
                                {error}
                            </motion.div>
                        )}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    required
                                    autoComplete="email"
                                    placeholder="name@company.com"
                                    className={`block w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all sm:text-sm ${
                                        fieldErrors.email ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500' : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                                    }`}
                                    onChange={handleChange}
                                />
                            </div>
                            {fieldErrors.email && <p className="mt-1.5 text-xs font-bold text-rose-500">{fieldErrors.email}</p>}
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-sm font-semibold text-slate-700">Password</label>
                                {!isAdminLogin && (
                                    <Link to="/forgot-password" className="text-xs font-semibold text-indigo-600 hover:text-indigo-500">
                                        Forgot password?
                                    </Link>
                                )}
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    required
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    className={`block w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all sm:text-sm ${
                                        fieldErrors.password ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500' : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                                    }`}
                                    onChange={handleChange}
                                />
                            </div>
                            {fieldErrors.password && <p className="mt-1.5 text-xs font-bold text-rose-500">{fieldErrors.password}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-lg text-sm font-bold text-white transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 ${
                                isAdminLogin 
                                    ? 'bg-slate-900 hover:bg-slate-800 shadow-slate-200' 
                                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                            }`}
                        >
                            {loading ? (
                                <Loader2 className="animate-spin h-5 w-5" />
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 border-t border-slate-100 pt-6">
                        <div className="flex flex-col gap-4">
                            {!isAdminLogin && (
                                <div className="text-center">
                                    <span className="text-sm text-slate-500 font-medium">New dealership? </span>
                                    <Link to="/register" className="text-sm font-bold text-indigo-600 hover:text-indigo-500">
                                        Partner with us
                                    </Link>
                                </div>
                            )}
                            
                            <button 
                                onClick={() => setIsAdminLogin(!isAdminLogin)}
                                className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
                            >
                                <AlertCircle size={14} />
                                {isAdminLogin ? 'Switch to Partner Login' : 'Admin Login'}
                            </button>
                        </div>
                    </div>
                </div>
                
                <p className="mt-8 text-center text-xs text-slate-400 font-medium uppercase tracking-tighter">
                    © {new Date().getFullYear()} AutoMoto AI • Advanced Dealership Automation
                </p>
            </div>
        </div>
    );
};

export default Login;
