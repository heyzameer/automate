import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ShieldCheck, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const AdminLogin = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    
    const { loading, error, setError, authenticate, checkAuth } = useAuth();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const validate = () => {
        const errors: Record<string, string> = {};
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
        
        // true flag passes isAdminLogin to the authenticate hook
        const success = await authenticate(formData, true);
        if (!success) {
            setFormData(prev => ({ ...prev, password: '' }));
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-emerald-500/30 overflow-hidden relative">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>
            
            <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
                <div className="flex justify-center mb-6">
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative group"
                    >
                        <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full group-hover:bg-emerald-500/40 transition-all duration-700"></div>
                        <img 
                            src="/logo-black.png" 
                            alt="Orbix Logo" 
                            className="w-16 h-16 object-contain relative z-10 drop-shadow-lg mix-blend-screen" 
                        />
                    </motion.div>
                </div>
                
                <h2 className="text-center text-3xl font-black tracking-tight text-white">
                    Super Admin Portal
                </h2>
                <p className="mt-2 text-center text-sm text-slate-400 font-medium">
                    System-wide governance & tenant management
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
                <div className="bg-slate-900/80 backdrop-blur-xl py-10 px-6 shadow-2xl rounded-3xl border border-slate-800 sm:px-12">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex items-center gap-2 text-rose-400 text-xs font-bold"
                            >
                                <AlertCircle size={14} />
                                {error}
                            </motion.div>
                        )}
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Admin Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    required
                                    autoComplete="email"
                                    placeholder="admin@system.com"
                                    className={`block w-full pl-11 pr-4 py-3 bg-slate-950/50 border rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 transition-all sm:text-sm ${
                                        fieldErrors.email ? 'border-rose-500/50 focus:ring-rose-500/20 text-rose-100' : 'border-slate-700/50 focus:ring-emerald-500/20 focus:border-emerald-500'
                                    }`}
                                    onChange={handleChange}
                                />
                            </div>
                            {fieldErrors.email && <p className="mt-1.5 text-xs font-bold text-rose-400">{fieldErrors.email}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Secure Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    required
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    className={`block w-full pl-11 pr-4 py-3 bg-slate-950/50 border rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 transition-all sm:text-sm ${
                                        fieldErrors.password ? 'border-rose-500/50 focus:ring-rose-500/20 text-rose-100' : 'border-slate-700/50 focus:ring-emerald-500/20 focus:border-emerald-500'
                                    }`}
                                    onChange={handleChange}
                                />
                            </div>
                            {fieldErrors.password && <p className="mt-1.5 text-xs font-bold text-rose-400">{fieldErrors.password}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-lg border border-emerald-500/20 text-sm font-bold text-white transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 bg-emerald-600/90 hover:bg-emerald-500 shadow-emerald-500/20"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin h-5 w-5" />
                            ) : (
                                <>
                                    Authorize Access
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
                
                <p className="mt-8 text-center text-xs text-slate-600 font-medium uppercase tracking-tighter">
                    Restricted Area • Supervised System Logons Only
                </p>
            </div>
        </div>
    );
};

export default AdminLogin;
