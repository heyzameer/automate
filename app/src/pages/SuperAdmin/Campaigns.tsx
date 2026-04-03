import React, { useState, useEffect } from 'react';
import { Send, Plus, Filter, Search, Loader2, Calendar, Target, Hash } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const Campaigns = () => {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCampaigns = async () => {
            try {
                const res = await api.get('/super-admin/campaigns');
                setCampaigns(res.data.data);
            } catch (err) {
                toast.error("Failed to fetch campaigns");
            } finally {
                setLoading(false);
            }
        };
        fetchCampaigns();
    }, []);

    if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-indigo-600" /></div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight text-[#0f172a]">Marketing Campaigns</h1>
                    <p className="text-slate-500 font-medium mt-1 text-sm tracking-tight">Monitor and broadcast bulk WhatsApp notifications across partner dealerships.</p>
                </div>
                <button className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg text-sm">
                    <Plus size={18} /> New Broadcast
                </button>
            </div>

            {/* Campaign Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                        <Send size={48} className="mx-auto text-slate-200 mb-4" />
                        <h3 className="text-xl font-black text-slate-900">No active broadcasts.</h3>
                        <p className="text-slate-400 font-medium text-sm mt-1">Start your first partner notification to drive sales leads.</p>
                    </div>
                ) : campaigns.map((campaign) => (
                    <div key={campaign._id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col justify-between hover:border-emerald-200 transition-all group">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${campaign.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {campaign.status}
                                </span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                    <Calendar size={10} /> {new Date(campaign.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-600 transition-colors">{campaign.name}</h3>
                                <p className="text-xs text-slate-400 font-bold mt-1 line-clamp-2">{campaign.description || "Global announcement"}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-slate-50 p-3 rounded-2xl flex flex-col items-center justify-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Sent</p>
                                    <h4 className="text-xl font-black text-slate-900 mt-1">{campaign.sentCount || 0}</h4>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-2xl flex flex-col items-center justify-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Target</p>
                                    <h4 className="text-xl font-black text-slate-900 mt-1 capitalize text-xs">{campaign.targetAudience.replace('_', ' ')}</h4>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-600">
                                <Target size={14} className="text-indigo-600" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Showroom A</span>
                            </div>
                            <button className="text-emerald-600 hover:bg-emerald-50 p-2 rounded-xl transition-all">
                                <Hash size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Campaigns;
