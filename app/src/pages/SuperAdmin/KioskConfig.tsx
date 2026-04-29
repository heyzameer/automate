import React, { useState, useEffect } from 'react';
import { 
    Monitor, Save, Loader2, Globe, Key, 
    RefreshCw, Eye, EyeOff, Copy, Building2,
    ShieldAlert
} from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useTenants } from '../../hooks/useTenants';

const KioskConfig = () => {
    const { tenants, loading, updateKioskConfig, rotateKioskKey, fetchTenants } = useTenants();
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
    const [allowedDomains, setAllowedDomains] = useState<Record<string, string>>({});
    const [localSaving, setLocalSaving] = useState<Record<string, boolean>>({});
    const [domainErrors, setDomainErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (tenants.length > 0) {
            const domains: Record<string, string> = {};
            tenants.forEach(t => {
                domains[t.id || t._id] = t.kioskConfig?.allowedDomains?.join(', ') || '';
            });
            setAllowedDomains(domains);
        }
    }, [tenants]);

    const toggleKeyVisibility = (id: string) => {
        setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const validateDomains = (id: string, value: string) => {
        if (!value.trim()) {
            setDomainErrors(prev => ({ ...prev, [id]: '' }));
            return true;
        }
        const domains = value.split(',').map(d => d.trim()).filter(d => d);
        const domainRegex = /^(https?:\/\/)?([\w\d-]+\.)+[\w\d]{2,}(\/.*)?$/;
        const invalid = domains.find(d => !domainRegex.test(d));
        
        if (invalid) {
            setDomainErrors(prev => ({ ...prev, [id]: `Invalid domain: ${invalid}` }));
            return false;
        }
        setDomainErrors(prev => ({ ...prev, [id]: '' }));
        return true;
    };

    const handleUpdateKiosk = async (id: string, currentKiosk: any) => {
        const domainStr = allowedDomains[id] || '';
        if (!validateDomains(id, domainStr)) return;

        setLocalSaving(prev => ({ ...prev, [id]: true }));
        try {
            const domains = domainStr.split(',').map(d => d.trim()).filter(d => d);
            await updateKioskConfig(id, {
                ...currentKiosk,
                allowedDomains: domains
            });
            fetchTenants();
        } finally {
            setLocalSaving(prev => ({ ...prev, [id]: false }));
        }
    };

    const handleToggleKiosk = async (id: string, currentKiosk: any) => {
        setLocalSaving(prev => ({ ...prev, [id + '-toggle']: true }));
        try {
            await updateKioskConfig(id, {
                ...currentKiosk,
                isActive: !currentKiosk?.isActive
            });
            fetchTenants();
        } finally {
            setLocalSaving(prev => ({ ...prev, [id + '-toggle']: false }));
        }
    };

    const handleRotate = async (id: string) => {
        setLocalSaving(prev => ({ ...prev, [id + '-rotate']: true }));
        try {
            await rotateKioskKey(id);
            fetchTenants();
        } finally {
            setLocalSaving(prev => ({ ...prev, [id + '-rotate']: false }));
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard!');
    };

    if (loading && tenants.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    Kiosk Platform Manager
                    <span className="bg-indigo-500 text-white text-[10px] px-3 py-1 rounded-full uppercase tracking-tighter">Secure Gateway</span>
                </h1>
                <p className="text-slate-500 font-medium mt-1">Enable and manage external website access to showroom inventory.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {tenants.map((tenant) => {
                    const tid = tenant.id || tenant._id;
                    const config = tenant.kioskConfig || {};
                    const isActive = config.isActive || false;
                    const isShowingKey = showKeys[tid] || false;

                    return (
                        <div key={tid} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden group hover:border-indigo-200 transition-all duration-300">
                            <div className="p-8 space-y-6">
                                {/* Header */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                            <Monitor size={28} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900">{tenant.name}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 py-0.5 bg-slate-50 rounded border border-slate-100">
                                                    {tenant.slug}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                    {isActive ? '● Kiosk Enabled' : '● Platform Disabled'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Toggle Switch */}
                                    <button
                                        onClick={() => handleToggleKiosk(tid, config)}
                                        disabled={localSaving[tid + '-toggle']}
                                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 focus:outline-none ${isActive ? 'bg-indigo-600' : 'bg-slate-200'} ${localSaving[tid + '-toggle'] ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                                    >
                                        <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${localSaving[tid + '-toggle'] ? 'opacity-100' : 'opacity-0'}`}>
                                            <Loader2 size={12} className="animate-spin text-white" />
                                        </div>
                                        <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-all duration-300 ${isActive ? 'translate-x-7' : 'translate-x-1'} ${localSaving[tid + '-toggle'] ? 'scale-0' : 'scale-100'}`} />
                                    </button>
                                </div>

                                {/* Config Body */}
                                <div className="space-y-5 pt-4 border-t border-slate-50">
                                    {/* Auth Key */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block flex items-center gap-1">
                                            <Key size={10} /> Kiosk Authorization Key
                                        </label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <input 
                                                    type={isShowingKey ? 'text' : 'password'}
                                                    value={config.kioskKey || 'Not generated'}
                                                    readOnly
                                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-mono text-xs font-bold text-slate-600 focus:bg-white transition-all"
                                                />
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                                    <button onClick={() => toggleKeyVisibility(tid)} className="text-slate-400 hover:text-indigo-600 transition-colors">
                                                        {isShowingKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                                    </button>
                                                    {config.kioskKey && (
                                                        <button onClick={() => copyToClipboard(config.kioskKey)} className="text-slate-400 hover:text-indigo-600 transition-colors">
                                                            <Copy size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleRotate(tid)}
                                                disabled={localSaving[tid + '-rotate']}
                                                className="px-4 bg-white border border-slate-100 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all flex items-center gap-2 font-bold text-xs shadow-sm active:scale-95 disabled:opacity-50"
                                                title="Rotate Key"
                                            >
                                                {localSaving[tid + '-rotate'] ? <Loader2 size={14} className="animate-spin text-indigo-500" /> : <RefreshCw size={14} />}
                                                Reset
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest px-1 flex items-center gap-1">
                                            <ShieldAlert size={10} /> Treat this as a sensitive password
                                        </p>
                                    </div>

                                    {/* Domains */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block flex items-center gap-1">
                                            <Globe size={10} /> Allowed Domains (CORS)
                                        </label>
                                        <input 
                                            type="text"
                                            value={allowedDomains[tid] || ''}
                                            onChange={(e) => {
                                                setAllowedDomains({...allowedDomains, [tid]: e.target.value});
                                                validateDomains(tid, e.target.value);
                                            }}
                                            className={`w-full px-5 py-4 bg-slate-50 border rounded-2xl focus:outline-none focus:ring-4 transition-all shadow-sm font-bold text-sm text-slate-800
                                                ${domainErrors[tid] ? 'border-rose-300 focus:ring-rose-500/10 focus:border-rose-400' : 'border-slate-100 focus:ring-indigo-500/10 focus:border-indigo-400 focus:bg-white'}
                                            `}
                                            placeholder="https://mykiosk.com, https://partner-portal.net"
                                        />
                                        {domainErrors[tid] && <p className="text-[10px] text-rose-500 font-bold px-1">{domainErrors[tid]}</p>}
                                        {!domainErrors[tid] && <p className="text-[10px] text-slate-400 font-medium px-1 italic">Comma-separated list of domains allowed to access the API.</p>}
                                    </div>
                                </div>

                                {/* Save Button */}
                                <div className="pt-4 flex justify-end">
                                    <button 
                                        onClick={() => handleUpdateKiosk(tid, config)}
                                        disabled={localSaving[tid] || !!domainErrors[tid]}
                                        className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-bold text-xs flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 disabled:opacity-50 disabled:grayscale"
                                    >
                                        {localSaving[tid] ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                        Update Kiosk Settings
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {tenants.length === 0 && (
                    <div className="col-span-full bg-white rounded-[3rem] p-20 text-center border border-dashed border-slate-200">
                        <Building2 size={48} className="mx-auto mb-4 text-slate-200" />
                        <p className="text-slate-400 font-black uppercase tracking-[0.2em]">No showrooms onboarded</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KioskConfig;
