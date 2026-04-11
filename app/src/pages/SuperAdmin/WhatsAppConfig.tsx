import React, { useState, useEffect } from 'react';
import {
    MessageSquare, Save, Loader2, ShieldCheck, Phone, Key,
    HelpCircle, Copy, Power, Bot, ToggleLeft, ToggleRight
} from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const WhatsAppConfig = () => {
    const [tenants, setTenants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [togglingBot, setTogglingBot] = useState<string | null>(null);

    useEffect(() => {
        const fetchTenants = async () => {
            try {
                const { data } = await api.get('/super/tenants');
                setTenants(data.data);
            } catch {
                toast.error("Failed to fetch showrooms");
            } finally {
                setLoading(false);
            }
        };
        fetchTenants();
    }, []);

    const handleUpdateWA = async (id: string, config: any) => {
        setSaving(id);
        try {
            await api.patch(`/super/tenants/${id}`, { whatsappConfig: config });
            toast.success("WhatsApp configuration updated");
            setTenants(prev => prev.map(t => (t._id || t.id) === id ? { ...t, whatsappConfig: config } : t));
        } catch {
            toast.error("Failed to update config");
        } finally {
            setSaving(null);
        }
    };

    const handleToggleBot = async (tenant: any) => {
        const tid = String(tenant._id || tenant.id);
        const currentEnabled = tenant.whatsappConfig?.botEnabled ?? true;
        const newState = !currentEnabled;
        setTogglingBot(tid);
        try {
            await api.patch(`/super/tenants/${tid}/bot-status`, { botEnabled: newState });
            setTenants(prev => prev.map(t =>
                (t._id || t.id) === tid
                    ? { ...t, whatsappConfig: { ...t.whatsappConfig, botEnabled: newState } }
                    : t
            ));
            toast.success(`Bot ${newState ? 'enabled' : 'disabled'} for ${tenant.name}`);
        } catch {
            toast.error("Failed to toggle bot status");
        } finally {
            setTogglingBot(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Bot Deployment Manager</h1>
                <p className="text-slate-500 font-medium mt-1">Assign Meta API credentials and control bot status per showroom.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {tenants.map((tenant) => {
                    const tid = tenant._id || tenant.id;
                    const botEnabled = tenant.whatsappConfig?.botEnabled ?? true;
                    const botActive = tenant.whatsappConfig?.isActive;
                    const isToggling = togglingBot === String(tid);

                    return (
                        <div key={tid} className="bg-white rounded-[2rem] border border-slate-100 shadow-xl p-8 flex flex-col justify-between group hover:border-indigo-200 transition-all duration-300">
                            <div className="space-y-6">
                                {/* Header: Showroom name + Bot toggle */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${botEnabled && botActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                            <Bot size={28} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900">{tenant.name}</h3>
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                <span className="text-[10px] font-black text-slate-400 capitalize px-2 py-0.5 bg-slate-50 rounded border border-slate-100">
                                                    {tenant.slug}
                                                </span>
                                                {!botActive ? (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-500">
                                                        Not Configured
                                                    </span>
                                                ) : (
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${botEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'}`}>
                                                        {botEnabled ? '● Bot Online' : '● Bot Disabled'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bot ON/OFF Kill Switch */}
                                    <div className="flex flex-col items-end gap-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bot Power</p>
                                        <button
                                            onClick={() => handleToggleBot(tenant)}
                                            disabled={isToggling || !botActive}
                                            title={!botActive ? 'Configure credentials first' : botEnabled ? 'Click to disable bot' : 'Click to enable bot'}
                                            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                                                botEnabled && botActive
                                                    ? 'bg-emerald-500 focus:ring-emerald-500'
                                                    : 'bg-slate-300 focus:ring-slate-400'
                                            }`}
                                        >
                                            {isToggling ? (
                                                <Loader2 size={12} className="absolute left-1/2 -translate-x-1/2 animate-spin text-white" />
                                            ) : (
                                                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${botEnabled && botActive ? 'translate-x-8' : 'translate-x-1'}`} />
                                            )}
                                        </button>
                                        <p className={`text-[10px] font-black ${botEnabled && botActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                                            {botEnabled && botActive ? 'ON' : 'OFF'}
                                        </p>
                                    </div>
                                </div>

                                {/* Credential Fields */}
                                <div className="space-y-4 pt-4 border-t border-slate-50">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-1">
                                                <Phone size={10} /> Phone Number ID
                                            </label>
                                            <input
                                                type="text"
                                                defaultValue={tenant.whatsappConfig?.phoneNumberId || ''}
                                                id={`phone-${tid}`}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-bold text-slate-900"
                                                placeholder="1052..."
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-1">
                                                <ShieldCheck size={10} /> Verify Token
                                            </label>
                                            <input
                                                type="text"
                                                defaultValue={tenant.whatsappConfig?.verifyToken || 'carbot_verify_token'}
                                                id={`verify-${tid}`}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-bold text-slate-900"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-1">
                                            <Key size={10} /> Meta Access Token
                                        </label>
                                        <textarea
                                            rows={3}
                                            defaultValue={tenant.whatsappConfig?.accessToken || ''}
                                            id={`token-${tid}`}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-[10px] font-mono text-slate-600"
                                            placeholder="EAA..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="mt-8 pt-6 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2 text-slate-400 italic text-[10px] font-medium">
                                        <HelpCircle size={12} />
                                        Webhook: /api/v1/bot/webhook
                                    </div>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText('https://api.carbotai.com/api/v1/bot/webhook');
                                            toast.success("Webhook URL copied!");
                                        }}
                                        className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                                    >
                                        <Copy size={10} /> Copy Webhook URL
                                    </button>
                                </div>
                                <button
                                    onClick={() => {
                                        const pId = (document.getElementById(`phone-${tid}`) as HTMLInputElement).value;
                                        const vT = (document.getElementById(`verify-${tid}`) as HTMLInputElement).value;
                                        const aT = (document.getElementById(`token-${tid}`) as HTMLTextAreaElement).value;
                                        handleUpdateWA(String(tid), {
                                            ...tenant.whatsappConfig,
                                            phoneNumberId: pId,
                                            verifyToken: vT,
                                            accessToken: aT,
                                            isActive: true,
                                        });
                                    }}
                                    disabled={saving === String(tid)}
                                    className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 w-full md:w-auto justify-center"
                                >
                                    {saving === String(tid) ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                    Deploy Bot
                                </button>
                            </div>
                        </div>
                    );
                })}

                {tenants.length === 0 && (
                    <div className="col-span-2 text-center py-20 text-slate-400">
                        <Bot size={40} className="mx-auto mb-4 opacity-20" />
                        <p className="font-bold uppercase tracking-widest text-xs">No showrooms onboarded yet</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WhatsAppConfig;
