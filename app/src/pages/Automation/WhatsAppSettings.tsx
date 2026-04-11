import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Save, Image, FileText, MapPin, Loader2, AlertTriangle, Bot, Power } from 'lucide-react';
import { cn } from '../../lib/utils';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function Automation() {
    const [tenant, setTenant] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [config, setConfig] = useState({
        botEnabled: true,
        greetingMessage: "",
        includeGallery: true,
        includeSpecs: true,
        includeLocation: true
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
                        includeGallery: t.whatsappConfig?.includeGallery ?? true,
                        includeSpecs: t.whatsappConfig?.includeSpecs ?? true,
                        includeLocation: t.whatsappConfig?.includeLocation ?? true
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
    // Admin-level kill-switch: botEnabled === false means Super Admin turned it off
    const adminDisabled = botConfigured && config.botEnabled === false;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">WhatsApp Bot</h1>
                <p className="text-slate-500 font-medium mt-1">Configure how your AI sales bot responds to customers.</p>
            </div>

            {/* Admin kill-switch warning */}
            {adminDisabled && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-4 bg-rose-50 border border-rose-200 rounded-2xl p-6"
                >
                    <div className="p-2 bg-rose-100 rounded-xl flex-shrink-0">
                        <Power className="text-rose-600 w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-black text-rose-800">Bot Paused by Administrator</h3>
                        <p className="text-sm text-rose-700 font-medium mt-1">
                            Your WhatsApp bot has been temporarily disabled by the platform administrator. 
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

            <div className={`max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 font-sans ${adminDisabled ? 'opacity-60 pointer-events-none' : ''}`}>
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
                                    { key: 'includeGallery', icon: Image, label: 'Vehicle Images (Gallery)', desc: 'Send car photos in the chat' },
                                    { key: 'includeSpecs', icon: FileText, label: 'Full Description & Specs', desc: 'Fuel, ownership, year details' },
                                    { key: 'includeLocation', icon: MapPin, label: 'Showroom Location', desc: 'Share address & map link' },
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
                                {config.includeGallery && (
                                    <div className="rounded-lg overflow-hidden mt-2 border border-black/5 bg-gray-100 h-24 flex items-center justify-center">
                                        <Image className="text-gray-400" size={28} />
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
        </div>
    );
}
