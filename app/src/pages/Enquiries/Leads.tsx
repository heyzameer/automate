import React, { useState, useEffect } from 'react';
import { Search, Phone, MessageCircle, Calendar, XCircle, Loader2, Filter, TrendingUp, User, Clock, AlertCircle, Plus, ChevronRight, History, MoreVertical } from 'lucide-react';
import { leadsService, Lead, LeadStage, LeadPriority } from '../../services/leads.service';
import toast from 'react-hot-toast';
import { format, isPast, isToday } from 'date-fns';

const STAGES: LeadStage[] = ['New', 'Contacted', 'Test Drive', 'Negotiation', 'Closed', 'Lost'];
const PRIORITIES: LeadPriority[] = ['Cold', 'Warm', 'Hot'];

const PriorityBadge = ({ priority }: { priority: LeadPriority }) => {
    const styles: Record<LeadPriority, string> = {
        'Hot': 'bg-rose-500 text-white shadow-lg shadow-rose-200 animate-pulse',
        'Warm': 'bg-amber-500 text-white shadow-lg shadow-amber-200',
        'Cold': 'bg-slate-400 text-white',
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${styles[priority]}`}>
            {priority}
        </span>
    );
};

const StageBadge = ({ stage }: { stage: LeadStage }) => {
    const styles: Record<LeadStage, string> = {
        'New': 'bg-blue-50 text-blue-600 border-blue-100',
        'Contacted': 'bg-indigo-50 text-indigo-600 border-indigo-100',
        'Test Drive': 'bg-purple-50 text-purple-600 border-purple-100',
        'Negotiation': 'bg-amber-50 text-amber-600 border-amber-100',
        'Closed': 'bg-emerald-50 text-emerald-600 border-emerald-100',
        'Lost': 'bg-slate-50 text-slate-600 border-slate-100',
    };
    return (
        <span className={`px-3 py-1 rounded-lg text-[11px] font-bold border ${styles[stage]}`}>
            {stage}
        </span>
    );
};

export default function Leads() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [isActionOpen, setIsActionOpen] = useState(false);
    const [newNote, setNewNote] = useState('');

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

    const handleUpdateLead = async (id: string, updates: Partial<Lead>) => {
        try {
            const updated = await leadsService.updateLead(id, updates);
            setLeads(leads.map(l => (l._id || l.id) === id ? updated : l));
            if (selectedLead && (selectedLead._id || selectedLead.id) === id) {
                setSelectedLead(updated);
            }
            toast.success("Lead updated");
        } catch {
            toast.error("Update failed");
        }
    };

    const handleAddCallLog = async () => {
        if (!selectedLead || !newNote) return;
        try {
            const updated = await leadsService.addCallLog(selectedLead._id || selectedLead.id, newNote, "Current User");
            setLeads(leads.map(l => (l._id || l.id) === (selectedLead._id || selectedLead.id) ? updated : l));
            setSelectedLead(updated);
            setNewNote('');
            toast.success("Log added");
        } catch {
            toast.error("Failed to add log");
        }
    };

    const isOverdue = (date?: string) => {
        if (!date) return false;
        const d = new Date(date);
        return isPast(d) && !isToday(d);
    };

    const filteredLeads = leads.filter(l => 
        l.name?.toLowerCase().includes(search.toLowerCase()) || 
        l.phone?.includes(search)
    );

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
            <p className="text-slate-400 font-bold animate-pulse uppercase tracking-widest text-xs">Synchronizing CRM...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header section with Stats */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Smart CRM</h1>
                    <p className="text-slate-500 font-medium mt-3 text-lg">Lead Intelligence & Conversion Hub</p>
                </div>
                
                <div className="flex gap-4">
                    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 px-6">
                        <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hot Leads</p>
                            <p className="text-2xl font-black text-slate-900">{leads.filter(l => l.priority === 'Hot').length}</p>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 px-6">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Follow Ups</p>
                            <p className="text-2xl font-black text-slate-900">{leads.filter(l => l.followUpDate).length}</p>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 px-6">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Booked Drives</p>
                            <p className="text-2xl font-black text-slate-900">{leads.filter(l => l.preferredDateTime && !['cancelled', 'lost'].includes(l.status)).length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* List and Actions Container */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-2xl shadow-slate-200/50 overflow-hidden flex flex-col min-h-[600px]">
                <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row items-center gap-6 bg-slate-50/20">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                        <input 
                            type="text" 
                            placeholder="Search by name, phone or vehicle ID..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-16 pr-6 py-5 bg-white border border-slate-200 rounded-[1.5rem] text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none"
                        />
                    </div>
                    <button className="bg-indigo-600 text-white px-8 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center gap-3 active:scale-95 transition-all">
                        <Filter size={18} />
                        Filter Pipeline
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/30 border-b border-slate-50">
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lead Identity</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status & Score</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Engagement Point</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Agent</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredLeads.map((lead) => (
                                <tr 
                                    key={lead._id || lead.id} 
                                    onClick={() => { setSelectedLead(lead); setIsActionOpen(true); }}
                                    className="hover:bg-indigo-50/30 transition-all cursor-pointer group"
                                >
                                    <td className="px-10 py-7">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-lg ${lead.priority === 'Hot' ? 'bg-gradient-to-br from-rose-500 to-pink-500' : 'bg-slate-200'}`}>
                                                {(lead.name || "U")[0]}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-900 text-base">{lead.name || "Anonymous Lead"}</span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-indigo-500 font-black">{lead.phone}</span>
                                                    {lead.source === 'qr_scan' && <span className="bg-emerald-100 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">QR SCAN</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-7">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                <StageBadge stage={lead.stage} />
                                                <PriorityBadge priority={lead.priority} />
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-indigo-500" style={{ width: `${Math.min(lead.score, 100)}%` }} />
                                                </div>
                                                <span className="text-[10px] font-black text-slate-400">{lead.score} pts</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-7 text-center space-y-3">
                                        {lead.preferredDateTime && !['cancelled', 'lost'].includes(lead.status) && (
                                            <div className="inline-flex flex-col items-center p-3 rounded-2xl border bg-emerald-50 border-emerald-100 w-full mb-2">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                                    <Calendar size={12} />
                                                    Test Drive
                                                </div>
                                                <span className="text-xs font-black mt-1 text-emerald-800">
                                                    {format(new Date(lead.preferredDateTime), 'MMM dd, HH:mm')}
                                                </span>
                                            </div>
                                        )}

                                        {lead.followUpDate ? (
                                            <div className={`inline-flex flex-col items-center p-3 rounded-2xl border w-full ${isOverdue(lead.followUpDate) ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    <Clock size={12} className={isOverdue(lead.followUpDate) ? 'text-rose-500' : ''} />
                                                    Follow Up
                                                </div>
                                                <span className={`text-xs font-black mt-1 ${isOverdue(lead.followUpDate) ? 'text-rose-600' : 'text-slate-700'}`}>
                                                    {format(new Date(lead.followUpDate), 'MMM dd, HH:mm')}
                                                </span>
                                                {isOverdue(lead.followUpDate) && <span className="text-[8px] font-black bg-rose-500 text-white px-1.5 rounded mt-1">OVERDUE</span>}
                                            </div>
                                        ) : (
                                            !lead.preferredDateTime && <span className="text-xs font-bold text-slate-300 italic">No schedules set</span>
                                        )}
                                    </td>
                                    <td className="px-10 py-7">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                                                <User size={14} />
                                            </div>
                                            <span className="text-xs font-black text-slate-600">{lead.assignedTo || "Unassigned"}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-7 text-right">
                                        <button className="p-3 text-slate-300 group-hover:text-indigo-600 group-hover:bg-indigo-50 rounded-2xl transition-all">
                                            <ChevronRight size={24} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Lead Intelligence Drawer / Modal */}
            {isActionOpen && selectedLead && (
                <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-300">
                    <div className="w-full max-w-xl bg-white shadow-[-20px_0_50px_rgba(0,0,0,0.1)] flex flex-col animate-in slide-in-from-right duration-500">
                        {/* Drawer Header */}
                        <div className="p-10 border-b border-slate-50 flex items-start justify-between bg-white sticky top-0 z-10">
                            <div className="flex items-center gap-6">
                                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-2xl font-black text-white ${selectedLead.priority === 'Hot' ? 'bg-gradient-to-br from-rose-500 to-pink-500' : 'bg-slate-200'}`}>
                                    {(selectedLead.name || "U")[0]}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900">{selectedLead.name || "Anonymous Lead"}</h2>
                                    <div className="flex items-center gap-4 mt-1">
                                        <p className="text-indigo-600 font-black">{selectedLead.phone}</p>
                                        <span className="text-slate-300">•</span>
                                        <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">{selectedLead.source}</span>
                                        {selectedLead.preferredDateTime && !['cancelled', 'lost'].includes(selectedLead.status) && (
                                            <>
                                                <span className="text-slate-300">•</span>
                                                <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-black text-xs flex items-center gap-1 uppercase tracking-widest">
                                                    <Calendar size={12} /> Booked for Drive
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setIsActionOpen(false)} className="p-3 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-2xl transition-all">
                                <XCircle size={24} />
                            </button>
                        </div>

                        {/* Drawer Content */}
                        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                            {/* Control Panel Section */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Pipeline Stage</label>
                                    <select 
                                        value={selectedLead.stage}
                                        onChange={(e) => handleUpdateLead(selectedLead._id || selectedLead.id, { stage: e.target.value as LeadStage })}
                                        className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-black text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                                    >
                                        {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Priority Rank</label>
                                    <select 
                                        value={selectedLead.priority}
                                        onChange={(e) => handleUpdateLead(selectedLead._id || selectedLead.id, { priority: e.target.value as LeadPriority })}
                                        className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-black text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                                    >
                                        {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Assigned Agent</label>
                                    <input 
                                        type="text"
                                        placeholder="Assign to..."
                                        value={selectedLead.assignedTo || ''}
                                        onChange={(e) => handleUpdateLead(selectedLead._id || selectedLead.id, { assignedTo: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-black text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Follow Up Date</label>
                                    <input 
                                        type="datetime-local"
                                        value={selectedLead.followUpDate ? format(new Date(selectedLead.followUpDate), "yyyy-MM-dd'T'HH:mm") : ''}
                                        onChange={(e) => handleUpdateLead(selectedLead._id || selectedLead.id, { followUpDate: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-black text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Call Logs Section */}
                            <div className="space-y-6 pt-6 border-t border-slate-50">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-3">
                                        <History size={16} className="text-indigo-400" />
                                        Activity Log
                                    </h3>
                                    <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full">{selectedLead.callLogs.length} Entries</span>
                                </div>

                                <div className="space-y-4">
                                    <div className="relative">
                                        <textarea 
                                            placeholder="Log a call or add internal notes..."
                                            value={newNote}
                                            onChange={(e) => setNewNote(e.target.value)}
                                            className="w-full h-32 p-6 bg-slate-50 border-none rounded-[1.5rem] text-sm font-medium text-slate-600 outline-none focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
                                        />
                                        <button 
                                            onClick={handleAddCallLog}
                                            disabled={!newNote}
                                            className="absolute bottom-4 right-4 bg-indigo-600 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>

                                    <div className="space-y-4 mt-8">
                                        {selectedLead.callLogs.slice().reverse().map((log, i) => (
                                            <div key={i} className="bg-slate-50/50 p-6 rounded-[1.5rem] border border-slate-50 relative group">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{log.agent || "System"}</span>
                                                    <span className="text-[10px] font-bold text-slate-300">{format(new Date(log.date), 'MMM dd, HH:mm')}</span>
                                                </div>
                                                <p className="text-sm font-medium text-slate-600 leading-relaxed">{log.note}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Drawer Footer Actions */}
                        <div className="p-10 bg-slate-50/50 border-t border-slate-50 flex gap-4">
                            <button className="flex-1 bg-emerald-500 text-white py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-100 flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all active:scale-95">
                                <MessageCircle size={18} />
                                Send Message
                            </button>
                            <button className="flex-1 bg-sky-500 text-white py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-sky-100 flex items-center justify-center gap-3 hover:bg-sky-600 transition-all active:scale-95">
                                <Phone size={18} />
                                Call Client
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
