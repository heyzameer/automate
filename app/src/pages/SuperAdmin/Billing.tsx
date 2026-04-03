import React, { useState, useEffect } from 'react';
import { CreditCard, TrendingUp, Users, DollarSign, Loader2, Search, ExternalLink, Filter } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const Billing = () => {
    const [stats, setStats] = useState<any>(null);
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBillingData = async () => {
            try {
                const [statsRes, subsRes] = await Promise.all([
                    api.get('/super-admin/billing/stats'),
                    api.get('/super-admin/billing/subscriptions')
                ]);
                setStats(statsRes.data.data);
                setSubscriptions(subsRes.data.data);
            } catch (err) {
                toast.error("Failed to fetch billing data");
            } finally {
                setLoading(false);
            }
        };
        fetchBillingData();
    }, []);

    if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-indigo-600" /></div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Revenue Dashboard</h1>
                <p className="text-slate-500 font-medium mt-1">Monitor platform performance and subscription revenue.</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center gap-6">
                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><TrendingUp size={32} /></div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Potential MRR</p>
                        <h2 className="text-3xl font-black text-slate-900">${stats?.totalPotentialMonthly || 0}</h2>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center gap-6">
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><Users size={32} /></div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Partner</p>
                        <h2 className="text-3xl font-black text-slate-900">{stats?.activeSubscriptions || 0}</h2>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center gap-6">
                    <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl"><CreditCard size={32} /></div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Stripe Status</p>
                        <h2 className="text-3xl font-black text-emerald-600">Healthy</h2>
                    </div>
                </div>
            </div>

            {/* Subscription Table */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="font-black text-slate-900">Partner Subscriptions</h3>
                    <div className="flex gap-2">
                        <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg"><Search size={18} /></button>
                        <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg"><Filter size={18} /></button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-50">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Partner</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cycle Date</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Invoice</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {subscriptions.map((sub) => (
                                <tr key={sub._id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-5 font-bold text-slate-900">{sub.tenantId?.name || "Global Partner"}</td>
                                    <td className="px-8 py-5">
                                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${sub.planId === 'enterprise' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100'}`}>
                                            {sub.planId}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className={`h-2 w-2 rounded-full ${sub.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                            <span className="text-xs font-bold text-slate-600 capitalize">{sub.status}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-xs font-bold text-slate-500">
                                        {new Date(sub.currentPeriodEnd || Date.now()).toLocaleDateString()}
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-xl transition-all">
                                            <ExternalLink size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Billing;
