import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Car, ArrowRight, Sparkles, Building2, Store } from 'lucide-react';
import { ROUTES } from '../constants/routes';

const Welcome = () => {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30 relative overflow-hidden flex flex-col justify-center">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none"></div>

            <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 lg:py-32 w-full text-center">
                
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-8 flex justify-center"
                >
                    <div className="relative group">
                        <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full group-hover:bg-indigo-500/40 transition-all duration-1000"></div>
                        <img 
                            src="/logo-black.png" 
                            alt="Orbix Logo" 
                            className="w-24 h-24 object-contain relative z-10 transition-transform duration-700 group-hover:rotate-12 mix-blend-screen" 
                        />
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-slate-800 text-sm font-bold text-indigo-400 mb-8"
                >
                    <Sparkles size={16} /> Dealership Automations
                </motion.div>
                
                <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white mb-8"
                >
                    Unleash your <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                        Digital Showroom
                    </span>
                </motion.h1>
                
                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-lg md:text-xl text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto mb-12"
                >
                    The smartest way to run a car dealership. Automatically capture leads, reply to WhatsApp inquiries 24/7, and close more sales with AI-driven pipelines.
                </motion.p>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    <Link 
                        to={ROUTES.LOGIN}
                        className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 group/btn shadow-xl shadow-indigo-500/20"
                    >
                        <Building2 size={20} />
                        Access Dashboard
                        <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform ml-2" />
                    </Link>
                    
                    <Link 
                        to={ROUTES.REGISTER}
                        className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 border border-slate-700 hover:border-slate-600"
                    >
                        <Store size={20} />
                        Partner With Us
                    </Link>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="mt-20 pt-10 border-t border-slate-800/50 flex items-center justify-center gap-3 text-slate-500 font-medium font-sans"
                >
                    <div className="flex items-center gap-2">
                        <img src="/logo-black.png" alt="Orbix Icon" className="w-5 h-5 object-contain opacity-50 mix-blend-screen" />
                        © {new Date().getFullYear()} Orbix Showroom Platform
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Welcome;
