import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Save, Image, FileText, MapPin, Loader2, AlertTriangle, Bot, Power } from 'lucide-react';
import { cn, handleUpgradePlan } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useAppSelector } from '../../store';
import { selectTenant } from '../../store/slices/tenantSlice';
import { ShieldAlert, ArrowUpCircle, ChevronRight, Zap, Megaphone } from 'lucide-react';

export default function Automation() {
    const [tenant, setTenant] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { getStoredUser } = useAuth();
    const user = getStoredUser();

    const reduxTenant = useAppSelector(selectTenant);
    const isLocked = reduxTenant?.features?.whatsappBot === false;

    const [config, setConfig] = useState({
        botEnabled: true,
        greetingMessage: "",
        includeSpecs: true,
        includeLocation: true,
        websiteLinkTemplate: 'https://uniquecars.com/inventory/{carCode}'
    });

    useEffect(() => {
        const fetchTenant = async () => {
            try {
                const { data } = await api.get('/auth/my-tenant');
                if (data.data?.tenant) {
                    const t = data.data.tenant;
                    setTenant(t);
                    setConfig({
                        botEnabled: t.whatsappConfig?.botEnabled ?? true,
                        greetingMessage: t.whatsappConfig?.greetingMessage || "Hi 👋\nThanks for contacting us.\nHere are the details you requested:",
                        includeSpecs: t.whatsappConfig?.includeSpecs ?? true,
                        includeLocation: t.whatsappConfig?.includeLocation ?? true,
                        websiteLinkTemplate: t.whatsappConfig?.websiteLinkTemplate || "https://uniquecars.com/inventory/{carCode}"
                    });
                }
            } catch {
                toast.error("Failed to load automation settings");
            } finally {
                setLoading(false);
            }
        };
        fetchTenant();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.patch('/auth/my-tenant', { whatsappConfig: config });
            toast.success("Automation settings saved successfully");
        } catch {
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    const botConfigured = tenant?.whatsappConfig?.isActive;
    // Platform-level kill-switch: if the whole tenant is suspended
    const platformDisabled = tenant?.isActive === false;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">WhatsApp Bot</h1>
                <p className="text-slate-500 font-medium mt-1">Configure how your AI sales bot responds to customers.</p>
            </div>

            {/* Platform-level suspension warning */}
            {platformDisabled && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-4 bg-rose-50 border border-rose-200 rounded-2xl p-6"
                >
                    <div className="p-2 bg-rose-100 rounded-xl flex-shrink-0">
                        <Power className="text-rose-600 w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-black text-rose-800">Showroom Suspended</h3>
                        <p className="text-sm text-rose-700 font-medium mt-1">
                            Your account has been temporarily disabled by the platform administrator. 
                            Customers will not receive automated replies until it is re-enabled. 
                            Contact support to restore access.
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Bot not yet configured */}
            {!botConfigured && (
                <div className="flex items-start gap-4 bg-amber-50 border border-amber-200 rounded-2xl p-6">
                    <AlertTriangle className="text-amber-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-black text-amber-800">Bot Not Yet Connected</h3>
                        <p className="text-sm text-amber-700 font-medium mt-1">
                            Your WhatsApp bot credentials haven't been configured yet. Contact your administrator to connect the Meta WhatsApp API.
                        </p>
                    </div>
                </div>
            )}

            {isLocked ? (
                <div className="bg-white rounded-[3.5rem] overflow-hidden border border-slate-100 shadow-xl relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white to-white pointer-events-none" />
                    
                    <div className="relative z-10 p-20 flex flex-col items-center text-center max-w-2xl mx-auto">
                        <div className="w-24 h-24 bg-emerald-500 rounded-[2rem] flex items-center justify-center text-white mb-10 shadow-2xl shadow-emerald-200 rotate-6">
                            <Bot size={48} />
                        </div>
                        
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-6">
                            Convert Leads 24/7 with <span className="premium-gradient-text">AI Sales Bot</span>
                        </h2>
                        
                        <p className="text-slate-500 font-medium text-lg leading-relaxed mb-12">
                            Stop losing leads after hours. Our AI bot responds instantly to vehicle inquiries, shares specs, and books test drives automatically on WhatsApp.
                            Bot features are part of our <span className="font-bold text-slate-900">Standard & Pro</span> plans.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-12">
                            {[
                                { title: 'Instant Replies', desc: 'Responds in < 2 seconds' },
                                { title: 'Specs Sharing', desc: 'Shares full car details' },
                                { title: 'Test Drive Booking', desc: 'Auto-schedules appointments' },
                                { title: 'Lead Capture', desc: 'Adds scannners to CRM' }
                            ].map(f => (
                                <div key={f.title} className="flex items-center gap-4 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 text-left">
                                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center flex-shrink-0">
                                        <Zap size={18} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{f.title}</p>
                                        <p className="text-[10px] font-bold text-slate-400">{f.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <button 
                            onClick={() => handleUpgradePlan(user, reduxTenant)}
                            className="inline-flex items-center gap-3 px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200"
                        >
                            <ArrowUpCircle size={20} />
                            Upgrade My Plan Now
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            ) : (
                <div className={`max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 font-sans ${platformDisabled ? 'opacity-60 pointer-events-none' : ''}`}>
                    {/* ... rest of the settings ... */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl p-8 space-y-6">
                            {/* Bot Status */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl ${config.botEnabled ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                                        <Bot className={`w-5 h-5 ${config.botEnabled ? 'text-emerald-600' : 'text-rose-500'}`} />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black text-slate-900">Auto-Reply Status</h3>
                                        <p className="text-xs font-medium text-slate-500">
                                            {config.botEnabled ? 'Bot is active and responding to customers' : 'Bot is paused — no auto-replies sent'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setConfig(prev => ({ ...prev, botEnabled: !prev.botEnabled }))}
                                    className={cn(
                                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                                        config.botEnabled ? "bg-indigo-600" : "bg-slate-200"
                                    )}
                                >
                                    <span className={cn(
                                        "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                                        config.botEnabled ? "translate-x-6" : "translate-x-1"
                                    )} />
                                </button>
                            </div>

                            {/* Greeting Message */}
                            <div className="pt-6 border-t border-slate-50">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Greeting Message</label>
                                <textarea
                                    rows={4}
                                    value={config.greetingMessage}
                                    onChange={(e) => setConfig(prev => ({ ...prev, greetingMessage: e.target.value }))}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-medium text-slate-900 resize-none"
                                />
                                <p className="text-xs text-slate-400 mt-2 font-medium">
                                    This message is sent when a customer first contacts the bot.
                                </p>
                            </div>

                            {/* Include Options */}
                            <div className="pt-6 border-t border-slate-50">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Include in Vehicle Reply</h4>
                                <div className="space-y-4">
                                    {[
                                        { key: 'includeSpecs', icon: FileText, label: 'Full Description & Specs', desc: 'Fuel, ownership, year details' },
                                        { key: 'includeLocation', icon: MapPin, label: 'Showroom Location', desc: 'Share address & map link within chat' },
                                    ].map(({ key, icon: Icon, label, desc }) => (
                                        <div key={key} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                                                    <Icon className="w-4 h-4 text-slate-500" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">{label}</p>
                                                    <p className="text-xs text-slate-400 font-medium">{desc}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setConfig(prev => ({ ...prev, [key]: !(prev as any)[key] }))}
                                                className={cn(
                                                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                                                    (config as any)[key] ? "bg-indigo-600" : "bg-slate-200"
                                                )}
                                            >
                                                <span className={cn(
                                                    "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                                                    (config as any)[key] ? "translate-x-6" : "translate-x-1"
                                                )} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* Website URL Templating */}
                            <div className="pt-6 border-t border-slate-50">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Vehicle Website URL Template</label>
                                <input
                                    type="text"
                                    value={config.websiteLinkTemplate}
                                    onChange={(e) => setConfig(prev => ({ ...prev, websiteLinkTemplate: e.target.value }))}
                                    placeholder="https://yourwebsite.com/cars/{carCode}"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-bold text-slate-900"
                                />
                                <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wide">
                                    Use <code className="text-indigo-500 bg-indigo-50 px-1 rounded">{'{carCode}'}</code> where the stock ID should be injected. We will send this link instead of a raw image.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Changes
                            </button>
                        </div>
                    </div>

                    {/* WhatsApp Preview */}
                    <div className="bg-[#e5ddd5] rounded-3xl p-4 shadow-xl border-4 border-gray-800 h-[600px] overflow-hidden flex flex-col relative">
                        <div className="absolute top-0 left-0 right-0 h-8 bg-gray-800 rounded-t-2xl z-10 flex justify-center">
                            <div className="w-20 h-4 bg-black rounded-b-xl"></div>
                        </div>
                        <div className="bg-[#075e54] text-white p-3 pt-10 flex items-center gap-3 shadow-md z-0">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                <MessageSquare className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold text-sm">{tenant?.name || 'Your Showroom'}</p>
                                <p className="text-[10px] text-white/80">{config.botEnabled ? 'online' : '⏸ paused'}</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            <div className="bg-white rounded-lg p-2 max-w-[80%] self-start shadow-sm text-xs rounded-tl-none text-gray-900 border border-gray-200">
                                Hi, I'm interested in a Maruti Swift
                            </div>

                            {config.botEnabled ? (
                                <div className="bg-[#dcf8c6] rounded-lg p-3 max-w-[85%] self-end shadow-sm text-sm space-y-2 rounded-tr-none ml-auto text-gray-900">
                                    <p className="whitespace-pre-wrap text-xs">{config.greetingMessage}</p>
                                    {config.websiteLinkTemplate && (
                                        <div className="rounded-lg overflow-hidden mt-2 border border-blue-100 bg-blue-50 p-2 text-blue-700 font-medium text-[10px] break-all">
                                            🔗 {config.websiteLinkTemplate.replace('{carCode}', 'car01')}
                                        </div>
                                    )}
                                    {config.includeSpecs && (
                                        <div className="space-y-0.5 pt-1">
                                            <p className="font-bold text-xs">Maruti Swift VXi</p>
                                            <p className="text-xs">₹ 5,75,000 • Petrol • 2022</p>
                                        </div>
                                    )}
                                    {config.includeLocation && (
                                        <p className="text-xs text-blue-600">📍 View on Maps</p>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-white/50 border border-rose-200 rounded-lg p-3 max-w-[85%] self-end shadow-sm text-xs rounded-tr-none ml-auto text-rose-500 text-center">
                                    ⏸ Auto-replies are currently paused.
                                </div>
                            )}
                        </div>

                        <div className="p-2 bg-[#f0f0f0] flex items-center gap-2">
                            <div className="flex-1 bg-white rounded-full h-9 px-4 flex items-center text-gray-400 text-sm border border-gray-200">Type a message</div>
                            <motion.div whileTap={{ scale: 0.9 }} className="w-9 h-9 bg-[#075e54] rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-[#064e46] transition-colors">
                                <MessageSquare className="w-4 h-4 rotate-90" />
                            </motion.div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
