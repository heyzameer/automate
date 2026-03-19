import React, { useState, useEffect } from 'react';
import { MessageSquare, ExternalLink, Loader2, Power } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const WhatsAppConfig = () => {
    const [tenants, setTenants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
        try {
            await api.patch(`/super/tenants/${id}`, { whatsappConfig: config });
            toast.success("WhatsApp configuration updated");
            // Refresh local state
            setTenants(tenants.map(t => (t._id || t.id) === id ? { ...t, whatsappConfig: config } : t));
        } catch {
            toast.error("Failed to update config");
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
        <div className="space-y-8 text-sans">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">WhatsApp Configuration</h1>
                <p className="text-slate-500 font-medium mt-1">Manage global Evolution API instances for each showroom.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tenants.map((tenant) => (
                    <div key={tenant._id || tenant.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-6 flex flex-col justify-between group hover:border-indigo-200 transition-all duration-300">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                    <MessageSquare size={24} />
                                </div>
                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${tenant.whatsappConfig?.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {tenant.whatsappConfig?.isActive ? 'Online' : 'Offline'}
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">{tenant.name}</h3>
                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">{tenant.slug}</p>
                            
                            <div className="mt-6 space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Instance ID</label>
                                    <input 
                                        type="text" 
                                        defaultValue={tenant.whatsappConfig?.instanceId || ''}
                                        onBlur={(e) => handleUpdateWA(tenant._id || tenant.id, { ...tenant.whatsappConfig, instanceId: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                                        placeholder="Enter Instance ID"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">API Token</label>
                                    <input 
                                        type="password" 
                                        defaultValue={tenant.whatsappConfig?.token || ''}
                                        onBlur={(e) => handleUpdateWA(tenant._id || tenant.id, { ...tenant.whatsappConfig, token: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                                        placeholder="Enter Token"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex items-center justify-between">
                            <button 
                                onClick={() => handleUpdateWA(tenant._id || tenant.id, { ...tenant.whatsappConfig, isActive: !tenant.whatsappConfig?.isActive })}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${tenant.whatsappConfig?.isActive ? 'text-rose-600 bg-rose-50 hover:bg-rose-100' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'}`}
                            >
                                <Power size={14} />
                                {tenant.whatsappConfig?.isActive ? 'Disconnect' : 'Connect Instance'}
                            </button>
                            <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                                <ExternalLink size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WhatsAppConfig;
