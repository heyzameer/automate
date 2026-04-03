import React, { useState, useEffect } from 'react';
import { MessageSquare, Save, Loader2, ShieldCheck, Phone, Key, HelpCircle, Copy } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const WhatsAppConfig = () => {
    const [tenants, setTenants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8 text-sans animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Bot Deployment Manager</h1>
                <p className="text-slate-500 font-medium mt-1">Assign Meta WhatsApp Cloud API credentials to partner showrooms.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {tenants.map((tenant) => (
                    <div key={tenant._id || tenant.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-xl p-8 flex flex-col justify-between group hover:border-indigo-200 transition-all duration-300">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                        <MessageSquare size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900">{tenant.name}</h3>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-slate-400 capitalize px-2 py-0.5 bg-slate-50 rounded border border-slate-100">{tenant.slug}</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${tenant.whatsappConfig?.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                {tenant.whatsappConfig?.isActive ? 'Bot Online' : 'Bot Offline'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-4 pt-4 border-t border-slate-50">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-1">
                                            <Phone size={10} /> Phone ID
                                        </label>
                                        <input 
                                            type="text" 
                                            defaultValue={tenant.whatsappConfig?.phoneNumberId || ''}
                                            id={`phone-${tenant._id || tenant.id}`}
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
                                            id={`verify-${tenant._id || tenant.id}`}
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
                                        id={`token-${tenant._id || tenant.id}`}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-[10px] font-mono text-slate-600"
                                        placeholder="EAA..."
                                    />
                                </div>
                            </div>
                        </div>

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
                                    const tId = tenant._id || tenant.id;
                                    const pId = (document.getElementById(`phone-${tId}`) as HTMLInputElement).value;
                                    const vT = (document.getElementById(`verify-${tId}`) as HTMLInputElement).value;
                                    const aT = (document.getElementById(`token-${tId}`) as HTMLTextAreaElement).value;
                                    handleUpdateWA(tId, { 
                                        ...tenant.whatsappConfig, 
                                        phoneNumberId: pId, 
                                        verifyToken: vT,
                                        accessToken: aT,
                                        isActive: true 
                                    });
                                }}
                                disabled={saving === (tenant._id || tenant.id)}
                                className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 w-full md:w-auto justify-center"
                            >
                                {saving === (tenant._id || tenant.id) ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                Deploy Bot
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WhatsAppConfig;
