import React, { useState, useEffect } from 'react';
import { Search, Loader2, Calendar, Filter, MessageSquare, Target } from 'lucide-react';
import { leadsService, Lead } from '../../services/leads.service';
import toast from 'react-hot-toast';

const StatusBadge = ({ status }: { status: Lead['status'] }) => {
    const styles: Record<string, string> = {
        'new': 'bg-blue-100 text-blue-700',
        'rescheduled': 'bg-purple-100 text-purple-700',
        'booked': 'bg-green-100 text-green-700',
        'cancelled': 'bg-rose-100 text-rose-700',
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
            {status}
        </span>
    );
};

export default function SuperAdminLeads() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchAllLeads = async () => {
            try {
                const data = await leadsService.getLeads(); // Proxy logic handles auth
                setLeads(data);
            } catch {
                toast.error("Failed to load global leads");
            } finally {
                setLoading(false);
            }
        };
        fetchAllLeads();
    }, []);

    const filteredLeads = leads.filter(l => 
        l.name?.toLowerCase().includes(search.toLowerCase()) || 
        l.phone?.includes(search)
    );

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-indigo-600" /></div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Global CRM Insights</h1>
                <p className="text-slate-500 font-medium mt-1">Cross-showroom visibility into daily customer bookings and enquiries.</p>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row items-center gap-4 bg-slate-50/30">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Find any customer by name or phone..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-50">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Partner Showroom</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Schedule</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Source</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredLeads.map((lead: any) => (
                                <tr key={lead._id || lead.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col">
                                            <span className="font-black text-slate-900">{lead.name || "Unknown"}</span>
                                            <span className="text-xs text-indigo-600 font-black">{lead.phone}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2">
                                            <Target size={14} className="text-slate-400" />
                                            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                                                Partner dealership
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <StatusBadge status={lead.status} />
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="text-xs font-bold text-slate-500 flex items-center gap-2">
                                            <Calendar size={14} className="text-slate-400" />
                                            {lead.preferredDateTime}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <span className="flex items-center justify-end gap-1.5 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                                            <MessageSquare size={12} />
                                            WhatsApp
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
