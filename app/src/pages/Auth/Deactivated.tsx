import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Mail, MessageSquare, LogOut, ArrowRight, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';

const Deactivated = () => {
    const navigate = useNavigate();
    const user = authService.getStoredUser();

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-rose-500/30 relative overflow-hidden bg-slate-950">
            {/* Background Gradients */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-full pointer-events-none">
                <div className="absolute top-[-10%] right-[10%] w-[500px] h-[500px] bg-rose-600/10 blur-[130px] rounded-full"></div>
                <div className="absolute bottom-[20%] left-[-10%] w-[500px] h-[500px] bg-amber-600/5 blur-[130px] rounded-full"></div>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-slate-900/80 backdrop-blur-xl py-12 px-8 shadow-2xl shadow-slate-950/50 rounded-[2.5rem] border border-slate-800 text-center"
                >
                    <div className="flex justify-center mb-8">
                        <div className="relative">
                            <div className="absolute inset-0 bg-rose-500/20 blur-2xl rounded-full"></div>
                            <div className="bg-rose-500 p-5 rounded-[2rem] relative z-10 shadow-xl shadow-rose-500/20">
                                <ShieldAlert className="text-white h-10 w-10" />
                            </div>
                        </div>
                    </div>

                    <h1 className="text-3xl font-black text-white tracking-tight mb-4">
                        Account <span className="text-rose-400">Pending</span> Verification
                    </h1>
                    
                    <p className="text-slate-400 font-medium leading-relaxed mb-8">
                        Welcome, <span className="text-white font-bold">{user?.fullName || 'Partner'}</span>. Your dealership access is currently restricted while our team verifies your business credentials.
                    </p>

                    <div className="space-y-4 mb-10 text-left">
                        <div className="flex items-start gap-4 p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                            <div className="p-2 bg-indigo-500/10 rounded-lg">
                                <Clock size={18} className="text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-white uppercase tracking-widest mb-0.5">Estimated Time</p>
                                <p className="text-sm text-slate-400 font-medium">Verification usually takes 12-24 business hours.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                <Mail size={18} className="text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-white uppercase tracking-widest mb-0.5">Notification</p>
                                <p className="text-sm text-slate-400 font-medium">We'll send an activation email to <strong>{user?.email}</strong> once approved.</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <a 
                            href="mailto:support@orbix.ai"
                            className="w-full flex justify-center items-center py-4 px-4 rounded-2xl text-sm font-black text-white bg-slate-800 hover:bg-slate-700 transition-all duration-300 transform hover:-translate-y-1"
                        >
                            <MessageSquare className="mr-2 h-5 w-5" />
                            Contact Support
                        </a>
                        <button
                            onClick={handleLogout}
                            className="w-full flex justify-center items-center py-4 px-4 rounded-2xl text-sm font-black text-slate-400 hover:text-white transition-all duration-300"
                        >
                            <LogOut className="mr-2 h-5 w-5" />
                            Sign Out
                        </button>
                    </div>
                </motion.div>

                <p className="mt-8 text-center text-[10px] text-slate-600 font-black uppercase tracking-[0.2em]">
                    Orbix AI • Secure Partner Portal
                </p>
            </div>
        </div>
    );
};

export default Deactivated;
