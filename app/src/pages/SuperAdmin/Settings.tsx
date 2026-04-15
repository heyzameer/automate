import React, { useState, useEffect } from 'react';
import { Database, Lock, Globe, Save, Cpu, Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../../services/auth.service';

const SystemSettings = () => {
    const [settings, setSettings] = useState<any>({
        geminiApiKey: '',
        platformName: '',
        supportPhone: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchSettings = async () => {
        try {
            const data = await authService.getSystemSettings();
            console.log("Fetched Settings:", data);
            if (data) {
                setSettings(data);
            }
        } catch (err) {
            toast.error("Failed to load settings from server");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            // Remove MongoDB internal fields before sending back if any
            const { _id, id, createdAt, updatedAt, __v, ...pureData } = settings;
            
            await authService.updateSystemSettings(pureData);
            toast.success("Global configurations persistent and live!");
            // Refresh to confirm
            await fetchSettings();
        } catch (err) {
            console.error("Save Error:", err);
            toast.error("Failed to synchronize settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Accessing Secure Config...</p>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
            {/* Top Bar with Floating Save */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 sticky top-0 z-30 bg-slate-50/80 backdrop-blur-md py-6 border-b border-slate-200 -mx-4 px-6 rounded-b-[2.5rem] shadow-sm">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        Platform Engine
                        <span className="bg-emerald-500 text-white text-[10px] px-3 py-1 rounded-full uppercase tracking-tighter">Live Config</span>
                    </h1>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Super Admin Infrastructure Control</p>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => window.location.reload()}
                        className="p-4 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 rounded-2xl transition-all active:scale-95"
                        title="Refresh Config"
                    >
                        <ArrowLeft className="rotate-90" size={20} />
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black flex items-center gap-4 hover:bg-indigo-600 transition-all shadow-2xl shadow-slate-900/20 active:scale-95 disabled:opacity-50 min-w-[240px] justify-center text-sm uppercase tracking-widest"
                    >
                        {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        {saving ? 'Synchronizing...' : 'Save All Changes'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-6">
                {/* AI Block */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 p-10 group hover:border-indigo-100 transition-all">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                            <Cpu size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Intelligence Engine</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Natural Language Processing</p>
                        </div>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Google Gemini API Key</label>
                            <div className="relative group-focus-within:scale-[1.02] transition-transform">
                                <input 
                                    type="password" 
                                    value={settings.geminiApiKey || ''} 
                                    onChange={(e) => setSettings({...settings, geminiApiKey: e.target.value})}
                                    placeholder="Enter AIzaSy... Key" 
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-400 font-mono text-sm transition-all shadow-sm" 
                                />
                                <Lock className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                            </div>
                            <div className="bg-amber-50 rounded-xl p-4 mt-4 border border-amber-100/50">
                                <p className="text-[10px] text-amber-700 font-bold leading-relaxed">
                                    ⚠️ Critical: This key enables AI-powered search and automated booking for all showroom WhatsApp bots.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Platform Identity */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 p-10 group hover:border-indigo-100 transition-all">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
                            <Globe size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Platform Branding</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Identity & Support</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Platform Visible Name</label>
                            <input 
                                type="text" 
                                value={settings.platformName || ''} 
                                onChange={(e) => setSettings({...settings, platformName: e.target.value})}
                                placeholder="E.g. CarBot AI"
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-400 font-bold text-slate-800 transition-all shadow-sm" 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Global Support Phone</label>
                            <input 
                                type="text" 
                                value={settings.supportPhone || ''} 
                                onChange={(e) => setSettings({...settings, supportPhone: e.target.value})}
                                placeholder="+1 (555) 000-0000"
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-400 font-bold text-slate-800 transition-all shadow-sm" 
                            />
                        </div>
                    </div>
                </div>

                {/* Info Footer Block */}
                <div className="col-span-full bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
                    <Database className="absolute -right-10 -bottom-10 w-64 h-64 text-white/10 rotate-12" />
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                        <div className="max-w-xl text-center md:text-left">
                            <h2 className="text-3xl font-black mb-4 tracking-tight leading-none uppercase">Mesh Configuration</h2>
                            <p className="text-slate-400 font-bold text-sm leading-relaxed">
                                Modifications to these global parameters are propagated to all connected microservices. 
                                WhatsApp bots refresh their internal cache every five minutes to sync with your latest changes.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemSettings;
