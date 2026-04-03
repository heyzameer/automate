import React, { useState, useEffect } from 'react';
import { Search, Phone, MessageCircle, Calendar, XCircle, Loader2, Filter } from 'lucide-react';
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

export default function Leads() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [reschedulingLead, setReschedulingLead] = useState<Lead | null>(null);
    const [newDate, setNewDate] = useState('');

    const fetchLeads = async () => {
        try {
            const data = await leadsService.getLeads();
            setLeads(data);
        } catch {
            toast.error("Failed to load leads");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLeads(); }, []);

    const handleCancel = async (id: string) => {
        if (!confirm("Cancel this test drive booking?")) return;
        try {
            await leadsService.updateLeadStatus(id, 'cancelled');
            toast.success("Booking cancelled");
            fetchLeads();
        } catch {
            toast.error("Failed to cancel booking");
        }
    };

    const handleReschedule = async () => {
        if (!reschedulingLead || !newDate) return;
        try {
            await leadsService.rescheduleLead(reschedulingLead.id || reschedulingLead._id!, newDate);
            toast.success("Booking rescheduled");
            setReschedulingLead(null);
            fetchLeads();
        } catch {
            toast.error("Failed to reschedule");
        }
    };

    const filteredLeads = leads.filter(l => 
        l.name?.toLowerCase().includes(search.toLowerCase()) || 
        l.phone?.includes(search)
    );

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-indigo-600" /></div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Booking Center</h1>
                    <p className="text-slate-500 font-medium mt-1">Manage test drive requests and customer interactions.</p>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row items-center gap-4 bg-slate-50/30">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Find leads by name or phone..." 
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
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Preferred Schedule</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredLeads.map((lead) => (
                                <tr key={lead._id || lead.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col">
                                            <span className="font-black text-slate-900">{lead.name || "Unknown"}</span>
                                            <span className="text-xs text-indigo-600 font-black">{lead.phone}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <StatusBadge status={lead.status} />
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="text-xs font-bold text-slate-600 flex items-center gap-2">
                                            <Calendar size={14} className="text-slate-400" />
                                            {lead.preferredDateTime}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => setReschedulingLead(lead)}
                                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                title="Reschedule"
                                            >
                                                <Calendar size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleCancel(lead._id || lead.id)}
                                                className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                title="Cancel Booking"
                                            >
                                                <XCircle size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Reschedule Modal */}
            {reschedulingLead && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl p-8 animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-black text-slate-900">Reschedule Test Drive</h3>
                        <p className="text-xs font-bold text-slate-400 mt-1 mb-6">Updating schedule for {reschedulingLead.name}</p>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">New Date & Time</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Tomorrow, 11 AM"
                                    value={newDate}
                                    onChange={(e) => setNewDate(e.target.value)}
                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold text-slate-900"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 justify-end mt-8">
                            <button onClick={() => setReschedulingLead(null)} className="px-5 py-2 font-black text-slate-400 text-sm">Cancel</button>
                            <button onClick={handleReschedule} className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-black text-xs shadow-lg shadow-indigo-100">Confirm Change</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
