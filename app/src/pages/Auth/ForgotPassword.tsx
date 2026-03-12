import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Car, 
  Mail, 
  Lock, 
  ArrowRight, 
  Loader2,
  AlertCircle,
  KeyRound,
  CheckCircle2
} from 'lucide-react';
import api from '../../lib/api';
import toast, { Toaster } from 'react-hot-toast';
import { ROUTES } from '../../constants/routes';
import { API_ENDPOINTS } from '../../constants/endpoints';

interface FieldErrors {
    email?: string;
    otp?: string;
    password?: string;
    confirmPassword?: string;
    [key: string]: string | undefined;
}

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1: Request OTP, 2: Reset Password
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [formData, setFormData] = useState({ otp: '', password: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const navigate = useNavigate();

    const validateStep1 = () => {
        const errors: FieldErrors = {};
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = 'Valid email is required';
        }
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateStep2 = () => {
        const errors: FieldErrors = {};
        if (!formData.otp || formData.otp.length !== 6) {
            errors.otp = '6-digit code is required';
        }
        if (!formData.password || formData.password.length < 8) {
            errors.password = 'Password must be at least 8 characters';
        }
        if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
        if (error) setError('');
        if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (error) setError('');
        if (fieldErrors[name]) setFieldErrors({ ...fieldErrors, [name]: '' });
    };

    const handleRequestOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateStep1()) return;
        
        setLoading(true);
        setError('');

        try {
            await api.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
            toast.success("OTP sent to your email!");
            setStep(2);
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to send OTP. Please check your email.';
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateStep2()) return;

        setLoading(true);
        setError('');

        try {
            await api.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
                email,
                otp: formData.otp,
                password: formData.password
            });
            toast.success("Password reset successful! Redirecting to login...");
            setTimeout(() => navigate(ROUTES.LOGIN), 2000);
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to reset password. Check your OTP.';
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
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
                        className="p-3 rounded-2xl shadow-xl bg-indigo-600 shadow-indigo-100"
                    >
                        <KeyRound className="text-white h-8 w-8" />
                    </motion.div>
                </div>
                
                <h2 className="text-center text-3xl font-black tracking-tight text-slate-900">
                    {step === 1 ? 'Forgot Password?' : 'Reset Password'}
                </h2>
                <p className="mt-2 text-center text-sm text-slate-500 font-medium">
                    {step === 1 
                        ? 'Enter your email to receive a recovery code' 
                        : 'Enter the code from your email and your new password'
                    }
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-10 px-6 shadow-2xl shadow-slate-200 rounded-3xl border border-slate-100 sm:px-12 relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.form 
                                key="request"
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: 20, opacity: 0 }}
                                className="space-y-6" 
                                onSubmit={handleRequestOTP}
                            >
                                {error && (
                                    <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-center gap-2 text-rose-600 text-xs font-bold">
                                        <AlertCircle size={14} />
                                        {error}
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={handleEmailChange}
                                            placeholder="name@company.com"
                                            className={`block w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all sm:text-sm ${
                                                fieldErrors.email ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500' : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                                            }`}
                                        />
                                    </div>
                                    {fieldErrors.email && <p className="mt-1.5 text-xs font-bold text-rose-500">{fieldErrors.email}</p>}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-200 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70"
                                >
                                    {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                                        <>
                                            Send Reset Code
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </button>
                            </motion.form>
                        ) : (
                            <motion.form 
                                key="reset"
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: 20, opacity: 0 }}
                                className="space-y-6" 
                                onSubmit={handleResetPassword}
                            >
                                {error && (
                                    <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-center gap-2 text-rose-600 text-xs font-bold">
                                        <AlertCircle size={14} />
                                        {error}
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Verification Code</label>
                                    <div className="relative group">
                                        <CheckCircle2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                        <input
                                            type="text"
                                            name="otp"
                                            required
                                            maxLength={6}
                                            value={formData.otp}
                                            onChange={handleFormChange}
                                            placeholder="Enter 6-digit code"
                                            className={`block w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all tracking-[0.5em] font-mono text-center sm:text-lg ${
                                                fieldErrors.otp ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500' : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                                            }`}
                                        />
                                    </div>
                                    {fieldErrors.otp && <p className="mt-1.5 text-xs font-bold text-rose-500">{fieldErrors.otp}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">New Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                        <input
                                            type="password"
                                            name="password"
                                            required
                                            value={formData.password}
                                            onChange={handleFormChange}
                                            placeholder="At least 8 characters"
                                            className={`block w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all sm:text-sm ${
                                                fieldErrors.password ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500' : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                                            }`}
                                        />
                                    </div>
                                    {fieldErrors.password && <p className="mt-1.5 text-xs font-bold text-rose-500">{fieldErrors.password}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm New Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            required
                                            value={formData.confirmPassword}
                                            onChange={handleFormChange}
                                            placeholder="Repeat password"
                                            className={`block w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all sm:text-sm ${
                                                fieldErrors.confirmPassword ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500' : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                                            }`}
                                        />
                                    </div>
                                    {fieldErrors.confirmPassword && <p className="mt-1.5 text-xs font-bold text-rose-500">{fieldErrors.confirmPassword}</p>}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-200 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70"
                                >
                                    {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                                        <>
                                            Reset Password
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </button>

                                <button 
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="w-full text-center text-xs font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition-colors"
                                >
                                    Change Email
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>
                    
                    <div className="mt-8 border-t border-slate-100 pt-6 text-center">
                        <Link to={ROUTES.LOGIN} className="text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors">
                            Back to Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
