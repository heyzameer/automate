import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Car, 
  Store, 
  Mail, 
  Lock, 
  Phone, 
  ArrowRight,
  Loader2,
  CheckCircle2,
  Globe,
  AlertCircle
} from 'lucide-react';
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
        businessName: '',
        fullName: '',
        email: '',
        phone: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    const validateStep1 = () => {
        const errors: FieldErrors = {};
        if (!formData.businessName || formData.businessName.length < 2) {
            errors.businessName = 'Business name must be at least 2 characters';
        }
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateStep2 = () => {
        const errors: FieldErrors = {};
        if (!formData.fullName || formData.fullName.length < 2) {
            errors.fullName = 'Full name is required';
        }
        if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Please enter a valid email address';
        }
        if (!formData.phone || !/^\+?[0-9]{10,15}$/.test(formData.phone.replace(/\s/g, ''))) {
            errors.phone = 'Please enter a valid phone number (min 10 digits)';
        }
        if (!formData.password || formData.password.length < 8) {
            errors.password = 'Password must be at least 8 characters';
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
        if (validateStep1()) {
            setStep(2);
        } else {
            toast.error("Please fix the errors before continuing");
        }
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
                fullName: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                password: formData.password
            }
        };

        try {
            await api.post(API_ENDPOINTS.AUTH.REGISTER_TENANT, payload);
            toast.success("Dealership registered! Redirecting to login...");
            setTimeout(() => navigate(ROUTES.LOGIN), 2000);
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'Registration failed. Check your data.';
            setError(message);
            toast.error(message);
            setFormData(prev => ({ ...prev, password: '' }));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <Toaster position="top-right" />
            
            <div className="sm:mx-auto sm:w-full sm:max-w-xl">
                <div className="flex justify-center mb-6">
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-indigo-600 p-3 rounded-2xl shadow-xl shadow-indigo-100"
                    >
                        <Car className="text-white h-8 w-8" />
                    </motion.div>
                </div>
                
                <h2 className="text-center text-3xl font-black tracking-tight text-slate-900">
                    Partner with AutoMoto AI
                </h2>
                <p className="mt-2 text-center text-sm text-slate-500 font-medium">
                    Scale your dealership with world-class automation
                </p>
                
                {/* Steps indicator */}
                <div className="mt-8 flex items-center justify-center space-x-4">
                    <div className={`flex items-center space-x-2 ${step === 1 ? 'text-indigo-600' : 'text-slate-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 ${step === 1 ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200'}`}>1</div>
                        <span className="text-xs font-bold uppercase tracking-widest">Showroom</span>
                    </div>
                    <div className="w-12 h-px bg-slate-200"></div>
                    <div className={`flex items-center space-x-2 ${step === 2 ? 'text-indigo-600' : 'text-slate-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 ${step === 2 ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200'}`}>2</div>
                        <span className="text-xs font-bold uppercase tracking-widest">Admin Account</span>
                    </div>
                </div>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-0 sm:px-4">
                <motion.div 
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white py-10 px-6 shadow-2xl shadow-slate-200 rounded-3xl border border-slate-100 sm:px-12 relative overflow-hidden"
                >
                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-center gap-2 text-rose-600 text-xs font-bold mb-6"
                        >
                            <AlertCircle className="flex-shrink-0" size={14} />
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
                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Business Name</label>
                                        <div className="relative group">
                                            <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                            <input
                                                type="text"
                                                name="businessName"
                                                required
                                                placeholder="e.g. Royal Motors"
                                                className={`block w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all sm:text-sm ${
                                                    fieldErrors.businessName ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500' : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                                                }`}
                                                onChange={handleChange}
                                                value={formData.businessName}
                                            />
                                        </div>
                                        {fieldErrors.businessName && <p className="mt-1.5 text-xs font-bold text-rose-500">{fieldErrors.businessName}</p>}
                                    </div>
                                </div>
                                
                                <button
                                    type="submit"
                                    className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-200 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
                                >
                                    Continue Setup
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </button>
                            </motion.form>
                        ) : (
                            <motion.form 
                                key="step2"
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: 20, opacity: 0 }}
                                className="space-y-6" 
                                onSubmit={handleSubmit}
                            >
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Admin Full Name</label>
                                    <div className="relative group">
                                        <CheckCircle2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                        <input
                                            type="text"
                                            name="fullName"
                                            required
                                            placeholder="John Doe"
                                            className={`block w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all sm:text-sm ${
                                                fieldErrors.fullName ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500' : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                                            }`}
                                            onChange={handleChange}
                                            value={formData.fullName}
                                        />
                                    </div>
                                    {fieldErrors.fullName && <p className="mt-1.5 text-xs font-bold text-rose-500">{fieldErrors.fullName}</p>}
                                </div>

                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                            <input
                                                type="email"
                                                name="email"
                                                required
                                                placeholder="admin@company.com"
                                                className={`block w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all sm:text-sm ${
                                                    fieldErrors.email ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500' : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                                                }`}
                                                onChange={handleChange}
                                                value={formData.email}
                                            />
                                        </div>
                                        {fieldErrors.email && <p className="mt-1.5 text-xs font-bold text-rose-500">{fieldErrors.email}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone Number</label>
                                        <div className="relative group">
                                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                            <input
                                                type="tel"
                                                name="phone"
                                                required
                                                placeholder="+91 98765 43210"
                                                className={`block w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all sm:text-sm ${
                                                    fieldErrors.phone ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500' : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                                                }`}
                                                onChange={handleChange}
                                                value={formData.phone}
                                            />
                                        </div>
                                        {fieldErrors.phone && <p className="mt-1.5 text-xs font-bold text-rose-500">{fieldErrors.phone}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Create Secure Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                        <input
                                            type="password"
                                            name="password"
                                            required
                                            placeholder="••••••••"
                                            className={`block w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all sm:text-sm ${
                                                fieldErrors.password ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500' : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                                            }`}
                                            onChange={handleChange}
                                            value={formData.password}
                                        />
                                    </div>
                                    {fieldErrors.password && <p className="mt-1.5 text-xs font-bold text-rose-500">{fieldErrors.password}</p>}
                                </div>

                                <div className="flex flex-col gap-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full flex justify-center items-center py-4 px-4 rounded-xl shadow-lg shadow-indigo-200 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-300 disabled:opacity-70"
                                    >
                                        {loading ? (
                                            <Loader2 className="animate-spin h-5 w-5" />
                                        ) : (
                                            <>
                                                Launch Showroom
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </>
                                        )}
                                    </button>
                                    
                                    <button 
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="text-xs font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition-colors"
                                    >
                                        Back to Business Details
                                    </button>
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </motion.div>
                
                <div className="mt-8 flex items-center justify-center space-x-2">
                    <span className="text-sm text-slate-500 font-medium">Already a partner? </span>
                    <Link to={ROUTES.LOGIN} className="text-sm font-bold text-indigo-600 hover:text-indigo-500">
                        Sign in to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
