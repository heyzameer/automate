import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, Store, Mail, Lock, Phone, ArrowRight, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import api from '../../lib/api';
import toast, { Toaster } from 'react-hot-toast';
import { ROUTES } from '../../constants/routes';
import { API_ENDPOINTS } from '../../constants/endpoints';

interface FieldErrors {
    businessName?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    password?: string;
    [key: string]: string | undefined;
}

const Register = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        businessName: '', fullName: '', email: '', phone: '', password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    const validateStep1 = () => {
        const errors: FieldErrors = {};
        if (!formData.businessName) {
            errors.businessName = 'Business name is required';
        } else if (formData.businessName.length < 3) {
            errors.businessName = 'Business name must be at least 3 characters long';
        } else if (/^[^a-zA-Z0-9]/.test(formData.businessName)) {
            errors.businessName = 'Business name should start with a letter or number';
        }
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateStep2 = () => {
        const errors: FieldErrors = {};
        
        // Full Name Validation
        if (!formData.fullName) {
            errors.fullName = 'Please enter your full name';
        } else if (formData.fullName.trim().split(' ').length < 2) {
            errors.fullName = 'Please enter both your first and last name';
        }

        // Email Validation
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!formData.email) {
            errors.email = 'Email address is required';
        } else if (!emailRegex.test(formData.email)) {
            errors.email = 'Please provide a valid professional email address';
        }

        // Phone Validation (Strict 10-12 digits)
        const phoneClean = formData.phone.replace(/[\s\-\+\(\)]/g, '');
        const phoneRegex = /^[0-9]{10,12}$/;
        if (!formData.phone) {
            errors.phone = 'Phone number is required for verification';
        } else if (!phoneRegex.test(phoneClean)) {
            errors.phone = 'Please enter a valid 10-12 digit phone number';
        }

        // Password Validation
        if (!formData.password) {
            errors.password = 'Security password is required';
        } else if (formData.password.length < 8) {
            errors.password = 'Password is too short (minimum 8 characters)';
        } else if (!/[A-Z]/.test(formData.password)) {
            errors.password = 'Password must contain at least one uppercase letter';
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

    const handleNext = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateStep1()) setStep(2);
        else toast.error("Please fix the errors before continuing");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateStep2()) {
            toast.error("Please fix the errors before submitting");
            return;
        }

        setLoading(true);
        setError('');

        const payload = {
            tenantData: {
                name: formData.businessName,
                expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Default 30 days
            },
            adminData: {
                fullName: formData.fullName, email: formData.email,
                phone: formData.phone, password: formData.password
            }
        };

        try {
            await api.post(API_ENDPOINTS.AUTH.REGISTER_TENANT, payload);
            
            toast.success("Dealership application submitted!");
            setTimeout(() => navigate(ROUTES.REGISTER_SUCCESS), 1500);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } }; message?: string };
            const message = e.response?.data?.message || e.message || 'Registration failed. Check your data.';
            setError(message);
            toast.error(message);
            setFormData(prev => ({ ...prev, password: '' }));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-indigo-500/30 relative overflow-hidden bg-slate-950">
            <Toaster position="top-right" />

            {/* Elegant Background Gradients */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-full pointer-events-none">
                <div className="absolute top-[-10%] right-[10%] w-[500px] h-[500px] bg-indigo-600/20 blur-[130px] rounded-full"></div>
                <div className="absolute bottom-[20%] left-[-10%] w-[500px] h-[500px] bg-emerald-600/10 blur-[130px] rounded-full"></div>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-2xl relative z-10 text-center mb-10">
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex justify-center mb-6"
                >
                    <div className="bg-indigo-600 p-3.5 rounded-2xl shadow-xl shadow-indigo-600/30">
                        <Car className="text-white h-8 w-8" />
                    </div>
                </motion.div>
                
                <motion.h1 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl md:text-6xl font-black text-white leading-[1.1] tracking-tight mb-6"
                >
                    Claim your <br className="hidden sm:block"/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-l from-indigo-400 to-emerald-400">
                        digital showroom.
                    </span>
                </motion.h1>
                <motion.p 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-base text-slate-400 font-medium leading-relaxed max-w-xl mx-auto"
                >
                    Set up your <span className="font-bold text-emerald-400">Orbix</span> dealership sandbox instantly and dominate your sales funnel.
                </motion.p>
            </div>

            <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl relative z-10"
            >
                <div className="bg-slate-900/80 backdrop-blur-xl py-10 px-6 shadow-2xl shadow-slate-950/50 rounded-3xl border border-slate-800 sm:px-12">
                    
                    {/* Stepper */}
                    <div className="mb-10">
                        <div className="flex items-center justify-between">
                            <div className={`flex flex-col gap-1 transition-opacity ${step >= 1 ? 'opacity-100' : 'opacity-40'}`}>
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Phase 1</span>
                                <span className="text-sm font-bold text-white">Business Details</span>
                            </div>
                            <div className="flex-1 mx-4 h-px bg-slate-800 relative overflow-hidden rounded-full">
                                <motion.div 
                                    className="absolute inset-y-0 left-0 bg-indigo-500"
                                    initial={{ width: '0%' }}
                                    animate={{ width: step === 2 ? '100%' : '0%' }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                            <div className={`flex flex-col gap-1 transition-opacity text-right ${step === 2 ? 'opacity-100' : 'opacity-40'}`}>
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Phase 2</span>
                                <span className="text-sm font-bold text-white">Administrator Setup</span>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-center gap-3 text-rose-400 text-sm font-bold mb-6"
                        >
                            <AlertCircle size={18} className="flex-shrink-0" />
                            {error}
                        </motion.div>
                    )}

                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.form 
                                key="step1"
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: 20, opacity: 0 }}
                                className="space-y-6" 
                                onSubmit={handleNext}
                            >
                                <div>
                                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Dealership / Business Name</label>
                                    <div className="relative group">
                                        <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                                        <input
                                            type="text"
                                            name="businessName"
                                            required
                                            placeholder="Royal Motors Automotive"
                                            className={`block w-full pl-12 pr-4 py-3.5 bg-slate-950/50 border border-slate-800 rounded-2xl text-white font-bold placeholder-slate-600 focus:outline-none transition-all ${
                                                fieldErrors.businessName ? 'border-rose-500/50 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10' : 'focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
                                            }`}
                                            onChange={handleChange}
                                            value={formData.businessName}
                                        />
                                    </div>
                                    {fieldErrors.businessName && <p className="mt-2 text-xs font-bold text-rose-400">{fieldErrors.businessName}</p>}
                                </div>
                                
                                <button
                                    type="submit"
                                    className="w-full flex justify-center items-center py-4 px-4 rounded-2xl text-sm font-black text-white transition-all duration-300 transform hover:-translate-y-1 bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/20"
                                >
                                    Continue Setup
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </button>
                            </motion.form>
                        ) : (
                            <motion.form 
                                key="step2"
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: 20, opacity: 0 }}
                                className="space-y-5" 
                                onSubmit={handleSubmit}
                            >
                                <div>
                                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Admin Full Name</label>
                                    <div className="relative group">
                                        <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                                        <input
                                            type="text"
                                            name="fullName"
                                            required
                                            placeholder="John Doe"
                                            className={`block w-full pl-12 pr-4 py-3.5 bg-slate-950/50 border border-slate-800 rounded-2xl text-white font-bold placeholder-slate-600 focus:outline-none transition-all ${
                                                fieldErrors.fullName ? 'border-rose-500/50 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10' : 'focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
                                            }`}
                                            onChange={handleChange}
                                            value={formData.fullName}
                                        />
                                    </div>
                                    {fieldErrors.fullName && <p className="mt-2 text-xs font-bold text-rose-400">{fieldErrors.fullName}</p>}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Email Address</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                                            <input
                                                type="email"
                                                name="email"
                                                required
                                                placeholder="admin@company.com"
                                                className={`block w-full pl-12 pr-4 py-3.5 bg-slate-950/50 border border-slate-800 rounded-2xl text-white font-bold placeholder-slate-600 focus:outline-none transition-all ${
                                                    fieldErrors.email ? 'border-rose-500/50 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10' : 'focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
                                                }`}
                                                onChange={handleChange}
                                                value={formData.email}
                                            />
                                        </div>
                                        {fieldErrors.email && <p className="mt-2 text-xs font-bold text-rose-400">{fieldErrors.email}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Phone Number</label>
                                        <div className="relative group">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                                            <input
                                                type="tel"
                                                name="phone"
                                                required
                                                placeholder="+91 98765 43210"
                                                className={`block w-full pl-12 pr-4 py-3.5 bg-slate-950/50 border border-slate-800 rounded-2xl text-white font-bold placeholder-slate-600 focus:outline-none transition-all ${
                                                    fieldErrors.phone ? 'border-rose-500/50 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10' : 'focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
                                                }`}
                                                onChange={handleChange}
                                                value={formData.phone}
                                            />
                                        </div>
                                        {fieldErrors.phone && <p className="mt-2 text-xs font-bold text-rose-400">{fieldErrors.phone}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Secure Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            required
                                            placeholder="••••••••"
                                            className={`block w-full pl-12 pr-12 py-3.5 bg-slate-950/50 border border-slate-800 rounded-2xl text-white font-bold placeholder-slate-600 focus:outline-none transition-all ${
                                                fieldErrors.password ? 'border-rose-500/50 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10' : 'focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
                                            }`}
                                            onChange={handleChange}
                                            value={formData.password}
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

                                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                                    <button 
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="py-4 px-6 rounded-2xl font-black text-slate-400 hover:bg-slate-800 hover:text-white uppercase tracking-widest text-[11px] transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 flex justify-center items-center py-4 px-4 rounded-2xl text-sm font-black text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/20 transition-all duration-300 disabled:opacity-70 transform hover:-translate-y-1"
                                    >
                                        {loading ? (
                                            <Loader2 className="animate-spin h-5 w-5" />
                                        ) : (
                                            <>
                                                Launch Showroom
                                                <ArrowRight className="ml-2 h-5 w-5" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    <div className="mt-8 pt-8 border-t border-slate-800/50 flexitems-center justify-center">
                        <div className="text-center">
                            <span className="text-sm text-slate-400 font-medium">Already have a partner account? </span>
                            <Link to={ROUTES.LOGIN} className="text-sm font-black text-indigo-400 hover:text-indigo-300 transition-colors">
                                Sign in directly
                            </Link>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
