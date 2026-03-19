import React from 'react';
import { Database, Lock, Globe, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const SystemSettings = () => {
    const handleSave = () => {
        toast.success("System configurations updated");
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Settings</h1>
                <p className="text-slate-500 font-medium mt-1">Configure global application parameters and infrastructure links.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Global API Limits */}
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <Lock className="text-indigo-600" size={20} />
                        <h3 className="text-lg font-bold text-slate-900">Security & Authentication</h3>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">JWT Token Expiry (Days)</label>
                            <input type="number" defaultValue="7" className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Max Failed Logins before Lockout</label>
                            <input type="number" defaultValue="5" className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold" />
                        </div>
                    </div>
                </div>

                {/* Infrastructure Links */}
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <Database className="text-indigo-600" size={20} />
                        <h3 className="text-lg font-bold text-slate-900">Infrastructure Endpoints</h3>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Evolution API Base URL</label>
                            <input type="text" defaultValue="https://api.whatsapp-bot.com" className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">RabbitMQ Cluster URI</label>
                            <input type="text" defaultValue="amqp://cluster0.internal:5672" className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold" />
                        </div>
                    </div>
                </div>

                <div className="col-span-full bg-slate-900 rounded-[2rem] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden relative">
                    <Globe className="absolute -right-10 -bottom-10 w-64 h-64 text-white/5 rotate-12" />
                    <div className="relative z-10">
                        <h2 className="text-3xl font-black mb-2">Ready to apply changes?</h2>
                        <p className="text-slate-400 font-medium max-w-md">Modified system parameters will update the running services via the API Gateway cache.</p>
                    </div>
                    <button 
                        onClick={handleSave}
                        className="relative z-10 bg-white text-slate-900 px-10 py-4 rounded-2xl font-black flex items-center gap-3 hover:bg-slate-100 transition-all shadow-2xl shadow-indigo-500/10 active:scale-95"
                    >
                        <Save size={20} />
                        Apply Global Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SystemSettings;
