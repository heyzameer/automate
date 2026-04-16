import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Car, Mail, Lock, ArrowRight, Loader2, AlertCircle, Sparkles, Megaphone, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [showPassword, setShowPassword] = useState(false);
    
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
        
        const success = await authenticate(formData, false);
        if (!success) {
            setFormData(prev => ({ ...prev, password: '' }));
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-indigo-500/30 relative overflow-hidden bg-slate-950">
            {/* Elegant Background Gradients */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-full pointer-events-none">
                <div className="absolute top-[-10%] left-[0%] w-[500px] h-[500px] bg-indigo-600/20 blur-[130px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[0%] w-[500px] h-[500px] bg-cyan-600/10 blur-[130px] rounded-full"></div>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-2xl relative z-10 text-center mb-10">
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex justify-center mb-6"
                >
                    <div className="relative group">
                        <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full group-hover:bg-indigo-500/40 transition-all duration-700"></div>
                        <img 
                            src="/logo-black.png" 
                            alt="Orbix Logo" 
                            className="w-16 h-16 object-contain relative z-10 drop-shadow-lg mix-blend-screen" 
                        />
                    </div>
                </motion.div>

                <motion.h1 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl md:text-6xl font-black text-white leading-[1.1] tracking-tight mb-6"
                >
                    Accelerate your <br className="hidden sm:block"/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                        digital showroom.
                    </span>
                </motion.h1>
                <motion.p 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-base text-slate-400 font-medium leading-relaxed max-w-xl mx-auto"
                >
                    Join hundreds of dealerships deploying fully autonomous WhatsApp sales agents and dynamic lead routing pipelines on <span className="font-bold text-indigo-400">Orbix</span>.
                </motion.p>
            </div>

            <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="sm:mx-auto sm:w-full sm:max-w-md relative z-10"
            >
                <div className="bg-slate-900/80 backdrop-blur-xl py-10 px-6 shadow-2xl shadow-slate-950/50 rounded-3xl border border-slate-800 sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-center gap-3 text-rose-400 text-sm font-bold"
                            >
                                <AlertCircle size={18} className="flex-shrink-0" />
                                {error}
                            </motion.div>
                        )}
                        
                        <div className="space-y-5">
                            <div>
                                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Dealership Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        required
                                        autoComplete="email"
                                        placeholder="partner@showroom.com"
                                        className={`block w-full pl-12 pr-4 py-3.5 bg-slate-950/50 border border-slate-800 rounded-2xl text-white font-bold placeholder-slate-600 focus:outline-none transition-all ${
                                            fieldErrors.email ? 'border-rose-500/50 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10' : 'focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
                                        }`}
                                        onChange={handleChange}
                                    />
                                </div>
                                {fieldErrors.email && <p className="mt-2 text-xs font-bold text-rose-400">{fieldErrors.email}</p>}
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Secure Password</label>
                                    <Link to={ROUTES.FORGOT_PASSWORD} className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        required
                                        autoComplete="current-password"
                                        placeholder="••••••••"
                                        className={`block w-full pl-12 pr-12 py-3.5 bg-slate-950/50 border border-slate-800 rounded-2xl text-white font-bold placeholder-slate-600 focus:outline-none transition-all ${
                                            fieldErrors.password ? 'border-rose-500/50 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10' : 'focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
                                        }`}
                                        onChange={handleChange}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-indigo-400 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {fieldErrors.password && <p className="mt-2 text-xs font-bold text-rose-400">{fieldErrors.password}</p>}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center py-4 px-4 rounded-2xl text-sm font-black text-white transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-70 bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/20"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin h-5 w-5" />
                            ) : (
                                <>
                                    Sign In To Dashboard
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-slate-800/50">
                        <div className="text-center">
                            <span className="text-sm text-slate-400 font-medium">New to Orbix? </span>
                            <Link to={ROUTES.REGISTER} className="text-sm font-black text-indigo-400 hover:text-indigo-300 transition-colors">
                                Apply for Partnership
                            </Link>
                        </div>
                    </div>
                </div>
                
                <p className="mt-8 text-center text-xs text-slate-600 font-medium uppercase tracking-tighter">
                    © {new Date().getFullYear()} Orbix AI • Automotive Operations
                </p>
            </motion.div>
        </div>
    );
};

export default Login;
