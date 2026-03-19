import React, { useState, useEffect } from 'react';
import { Package, Calendar, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { authService } from '../../services/auth.service';
import toast from 'react-hot-toast';

interface SubscriptionTenant {
    name: string;
    plan: string;
    maxCars: number;
    maxLeads: number;
    currentCars: number;
    currentLeads: number;
    expiryDate: string;
    isActive: boolean;
}

const Subscription = () => {
    const [tenant, setTenant] = useState<SubscriptionTenant | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTenant = async () => {
            try {
                const data = await authService.getMyTenant();
                if (data?.tenant) {
                    const t = data.tenant;
                    setTenant({
                        name: t.name,
                        plan: t.plan ? `${t.plan.charAt(0) + t.plan.slice(1).toLowerCase()} Plan` : 'N/A',
                        maxCars: t.limits?.maxCars || 0,
                        maxLeads: t.limits?.maxLeads || 0,
                        currentCars: 0, // Placeholder for future inventory count
                        currentLeads: 0, // Placeholder for future lead count
                        expiryDate: t.expiryDate,
                        isActive: t.isActive,
                    });
                }
            } catch (error) {
                toast.error("Failed to load subscription info");
                console.error("Failed to fetch tenant info", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTenant();
    }, []);

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
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Subscription</h1>
                <p className="text-slate-500 font-medium mt-1">Manage your active dealership plan and viewing limits.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Active Plan Card */}
                <div className="lg:col-span-2 bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden flex flex-col justify-between shadow-2xl shadow-indigo-900/20">
                    <div className="absolute top-0 right-0 p-8">
                        <Package className="text-white/10 w-48 h-48 -mr-16 -mt-16 rotate-12" />
                    </div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${tenant?.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                    {tenant?.isActive ? 'Active Plan' : 'Suspended'}
                                </span>
                            </div>
                            <h2 className="text-5xl font-black">{tenant?.plan}</h2>
                            <p className="text-slate-400 mt-2 font-medium max-w-sm">Access to premium AI automation, high volume API routes, and full inventory tracking.</p>
                        </div>

                        <div className="text-right mt-8 md:mt-0">
                            <button disabled className="bg-white/10 hover:bg-white/20 transition-colors text-white px-6 py-3 rounded-xl font-bold text-sm">
                                Upgrade Plan (Coming Soon)
                            </button>
                        </div>
                    </div>
                    
                    <div className="relative z-10 grid grid-cols-2 gap-4 mt-12 bg-white/5 rounded-2xl p-6 backdrop-blur-sm border border-white/10">
                        <div className="border-r border-white/10">
                            <span className="text-xs uppercase font-bold text-slate-400 tracking-widest">Inventory Limit</span>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-3xl font-black text-white">{tenant?.currentCars}</span>
                                <span className="text-sm font-medium text-slate-400">/ {tenant?.maxCars} Cars</span>
                            </div>
                        </div>
                        <div className="pl-4">
                            <span className="text-xs uppercase font-bold text-slate-400 tracking-widest">Automation Limits</span>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-3xl font-black text-white">{tenant?.currentLeads}</span>
                                <span className="text-sm font-medium text-slate-400">/ {tenant?.maxLeads} Leads</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Expiry / Billing Column */}
                <div className="space-y-6">
                    <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-xl shadow-slate-200/50 flex items-start gap-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Calendar size={20} />
                        </div>
                        <div>
                            <span className="text-xs uppercase font-bold text-slate-400 tracking-widest">Next Renewal</span>
                            <h3 className="text-xl font-black text-slate-900 mt-1">
                                {tenant?.expiryDate ? new Date(tenant.expiryDate).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}
                            </h3>
                            <p className="text-xs text-slate-500 mt-2 font-medium">Your subscription automatically renews unless cancelled.</p>
                        </div>
                    </div>
                    
                    <div className="bg-orange-50/50 rounded-[2rem] p-6 border border-orange-100">
                        <div className="flex items-center gap-2 text-orange-600 mb-2">
                            <AlertCircle size={20} />
                            <h3 className="font-bold">Usage Warning</h3>
                        </div>
                        <p className="text-sm text-slate-600 font-medium">You are approaching your maximum lead limit. Consider upgrading your plan soon to prevent service interruption.</p>
                    </div>

                    <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-xl shadow-slate-200/50">
                        <h4 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-widest">Included Features</h4>
                        <ul className="space-y-3 font-medium text-sm text-slate-600">
                            <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> AI WhatsApp Responding</li>
                            <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Smart Lead Routing</li>
                            <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Basic Dealership Analytics</li>
                            <li className="flex items-center gap-2 text-slate-400"><XCircle size={16} /> <del>Custom Form Builder</del></li>
                            <li className="flex items-center gap-2 text-slate-400"><XCircle size={16} /> <del>Multi-Branch Tracking</del></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Subscription;
