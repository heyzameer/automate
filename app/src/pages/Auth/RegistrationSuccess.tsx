import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Mail, MessageSquare, ArrowLeft, Clock } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

const RegistrationSuccess = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-indigo-500/30 relative overflow-hidden bg-slate-950">
            {/* Elegant Background Gradients */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-full pointer-events-none">
                <div className="absolute top-[-10%] right-[10%] w-[500px] h-[500px] bg-indigo-600/10 blur-[130px] rounded-full"></div>
                <div className="absolute bottom-[20%] left-[-10%] w-[500px] h-[500px] bg-emerald-600/5 blur-[130px] rounded-full"></div>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-slate-900/80 backdrop-blur-xl py-12 px-8 shadow-2xl shadow-slate-950/50 rounded-[2.5rem] border border-slate-800 text-center"
                >
                    <div className="flex justify-center mb-8">
                        <div className="relative">
                            <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full"
                            ></motion.div>
                            <div className="bg-emerald-500 p-5 rounded-[2rem] relative z-10 shadow-xl shadow-emerald-500/20">
                                <CheckCircle2 className="text-white h-10 w-10" />
                            </div>
                        </div>
                    </div>

                    <h1 className="text-3xl font-black text-white tracking-tight mb-4">
                        Registration <span className="text-emerald-400">Complete!</span>
                    </h1>
                    
                    <p className="text-slate-400 font-medium leading-relaxed mb-10">
                        Thank you for choosing <strong>Orbix</strong>. Your showroom application has been received and is currently in the verification queue.
                    </p>

                    <div className="space-y-4 mb-10 text-left">
                        <div className="flex items-start gap-4 p-5 bg-slate-950/50 rounded-2xl border border-slate-800">
                            <div className="p-2.5 bg-indigo-500/10 rounded-xl">
                                <Clock size={20} className="text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-white uppercase tracking-widest mb-1">Status: Under Review</p>
                                <p className="text-sm text-slate-400 font-medium leading-relaxed">Our team will verify your dealership credentials within 12-24 business hours.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-5 bg-slate-950/50 rounded-2xl border border-slate-800">
                            <div className="p-2.5 bg-cyan-500/10 rounded-xl">
                                <Mail size={20} className="text-cyan-400" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-white uppercase tracking-widest mb-1">Next Step: Email Activation</p>
                                <p className="text-sm text-slate-400 font-medium leading-relaxed">You will receive an activation email as soon as your dashboard is ready.</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <Link
                            to={ROUTES.LOGIN}
                            className="w-full flex justify-center items-center py-4 px-4 rounded-2xl text-sm font-black text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/20 transition-all duration-300 transform hover:-translate-y-1"
                        >
                            Return to Login
                        </Link>
                        <a 
                            href="mailto:support@orbix.ai"
                            className="w-full flex justify-center items-center py-4 px-4 rounded-2xl text-sm font-black text-slate-400 hover:text-white transition-all duration-300"
                        >
                            <MessageSquare className="mr-2 h-5 w-5" />
                            Talk to Partner Support
                        </a>
                    </div>
                </motion.div>

                <div className="mt-10 flex items-center justify-center gap-2 text-slate-500">
                    <span className="w-8 h-px bg-slate-800"></span>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Orbix Automotive AI</p>
                    <span className="w-8 h-px bg-slate-800"></span>
                </div>
            </div>
        </div>
    );
};

export default RegistrationSuccess;
