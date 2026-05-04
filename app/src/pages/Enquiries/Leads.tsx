import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Phone, MessageCircle, Calendar, XCircle, Loader2, Filter, TrendingUp, User, Clock, Car, History, MoreVertical, CheckCircle2, Edit, Trash2 } from 'lucide-react';
import { leadsService, Lead, LeadStage, LeadPriority } from '../../services/leads.service';
import { vehicleService, Vehicle } from '../../services/vehicle.service';
import toast from 'react-hot-toast';
import { format, isPast, isToday } from 'date-fns';

const STAGES: LeadStage[] = ['New', 'Contacted', 'Test Drive', 'Negotiation', 'Closed', 'Lost'];
const PRIORITIES: LeadPriority[] = ['Cold', 'Warm', 'Hot'];

const PriorityBadge = ({ priority }: { priority: LeadPriority }) => {
    const styles: Record<LeadPriority, string> = {
        'Hot': 'bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow-lg shadow-rose-200/50 animate-pulse',
        'Warm': 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-200/50',
        'Cold': 'bg-slate-100 text-slate-500 border border-slate-200',
    };
    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${styles[priority]}`}>
            {priority}
        </span>
    );
};

const StageBadge = ({ stage }: { stage: LeadStage }) => {
    const styles: Record<LeadStage, string> = {
        'New': 'bg-blue-50 text-blue-600 border-blue-200',
        'Contacted': 'bg-indigo-50 text-indigo-600 border-indigo-200',
        'Test Drive': 'bg-purple-50 text-purple-600 border-purple-200',
        'Negotiation': 'bg-amber-50 text-amber-600 border-amber-200',
        'Closed': 'bg-emerald-50 text-emerald-600 border-emerald-200',
        'Lost': 'bg-slate-50 text-slate-500 border-slate-200',
    };
    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[stage]}`}>
            {stage}
        </span>
    );
};

import { useAppDispatch, useAppSelector } from '../../store';
import {
    fetchLeads,
    updateLead as updateLeadThunk,
    addCallLog as addCallLogThunk,
    updateCallLog as updateCallLogThunk,
    selectLeads,
    selectLeadsLoading,
    upsertLead,
} from '../../store/slices/leadsSlice';
import { fetchVehicles, selectVehicles } from '../../store/slices/vehiclesSlice';

export default function Leads() {
    const [searchParams] = useSearchParams();
    const initialSearch = searchParams.get('search') || '';
    
    const dispatch = useAppDispatch();
    const allLeads = useAppSelector(selectLeads);
    const loading = useAppSelector(selectLeadsLoading);
    const allVehicles = useAppSelector(selectVehicles);

    const [search, setSearch] = useState(initialSearch);
    const [filterStage, setFilterStage] = useState<string>('All');
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [newNote, setNewNote] = useState('');
    const [editingLogId, setEditingLogId] = useState<string | null>(null);
    const [editNote, setEditNote] = useState('');

    // Build vehiclesMap from Redux store — no extra fetch needed
    const vehiclesMap = useMemo(() => {
        const m: Record<string, Vehicle> = {};
        allVehicles.forEach(v => {
            if (v._id) m[v._id] = v;
            if (v.id) m[v.id] = v;
        });
        return m;
    }, [allVehicles]);

    const leads = useMemo(() => allLeads, [allLeads]);

    useEffect(() => {
        dispatch(fetchLeads(undefined)); // guarded — no duplicate
        dispatch(fetchVehicles());       // guarded — no duplicate
    }, [dispatch]);

    const handleUpdateLead = async (id: string, updates: Partial<Lead>) => {
        try {
            const updated = await leadsService.updateLead(id, updates);
            dispatch(upsertLead(updated));
            if (selectedLead && (selectedLead._id || selectedLead.id) === id) {
                setSelectedLead(updated);
            }
            toast.success("Lead updated successfully!");
        } catch {
            toast.error("Update failed");
        }
    };

    const handleAddCallLog = async () => {
        if (!selectedLead || !newNote) return;
        try {
            const updated = await leadsService.addCallLog(selectedLead._id || selectedLead.id, newNote, "Current User");
            dispatch(upsertLead(updated));
            setSelectedLead(updated);
            setNewNote('');
            toast.success("Log added successfully!");
        } catch {
            toast.error("Failed to add log");
        }
    };

    const handleUpdateCallLog = async (logId: string) => {
        if (!selectedLead || !editNote) return;
        try {
            const updated = await leadsService.updateCallLog(selectedLead._id || selectedLead.id, logId, editNote);
            dispatch(upsertLead(updated));
            setSelectedLead(updated);
            setEditingLogId(null);
            setEditNote('');
            toast.success("Log updated successfully!");
        } catch {
            toast.error("Failed to update log");
        }
    };

    const handleDeleteCallLog = async (logId: string) => {
        if (!selectedLead) return;
        if (!window.confirm("Are you sure you want to delete this log entry?")) return;
        try {
            const updated = await leadsService.deleteCallLog(selectedLead._id || selectedLead.id, logId);
            dispatch(upsertLead(updated));
            setSelectedLead(updated);
            toast.success("Log deleted successfully!");
        } catch {
            toast.error("Failed to delete log");
        }
    };

    const isOverdue = (date?: string) => {
        if (!date) return false;
        const d = new Date(date);
        if (isNaN(d.getTime())) return false;
        return isPast(d) && !isToday(d);
    };

    const isValidDate = (date?: string | Date | null) => {
        if (!date) return false;
        return !isNaN(new Date(date).getTime());
    };

    const safeFormatDate = (date?: string | Date | null, formatStr: string = 'MMM dd, HH:mm') => {
        if (!isValidDate(date)) return 'N/A';
        return format(new Date(date!), formatStr);
    };

    const getVehicleDisplayName = (id: string) => {
        const v = vehiclesMap[id];
        if (!v) return `ID: ${id.slice(-6)}`;
        const brand = v.attributes?.brand || '';
        const model = v.attributes?.model || '';
        if (brand || model) return `${brand} ${model}`.trim();
        return v.attributes?.car_code || id;
    };

    const SLOT_MAP: Record<string, string> = {
        'SLOT_10AM': '10:00 AM',
        'SLOT_2PM': '02:00 PM',
        'SLOT_4PM': '04:00 PM'
    };

    const formatSlot = (slot: string) => SLOT_MAP[slot] || slot;

    const filteredLeads = leads.filter(l => {
        const matchSearch = l.name?.toLowerCase().includes(search.toLowerCase()) || l.phone?.includes(search) || l.vehicleId?.toLowerCase().includes(search.toLowerCase());
        const matchStage = filterStage === 'All' ? true : l.stage === filterStage;
        return matchSearch && matchStage;
    }).sort((a,b) => b.score - a.score); // Highest score first

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[70vh] space-y-6 animate-in fade-in zoom-in duration-700">
            <div className="relative">
                <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                <Loader2 className="animate-spin text-indigo-600 relative z-10" size={48} />
            </div>
            <p className="text-slate-400 font-black animate-pulse uppercase tracking-widest text-xs">Synchronizing Intelligence...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
            {/* Header section with Stats */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900">Lead Intelligence</h1>
                    <p className="text-slate-500 font-medium mt-3 text-lg">Manage your entire conversion funnel.</p>
                </div>
                
                <div className="flex flex-wrap gap-4">
                    <div className="bg-white p-5 rounded-[2rem] border border-slate-200/60 shadow-xl shadow-slate-200/20 flex flex-col justify-center min-w-[140px] relative overflow-hidden group hover:border-rose-200 transition-all">
                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-rose-50 rounded-full blur-2xl group-hover:scale-150 transition-all duration-700"></div>
                        <div className="flex items-center gap-3 mb-2 opacity-80">
                            <TrendingUp size={18} className="text-rose-500" />
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Hot Leads</p>
                        </div>
                        <p className="text-3xl font-black text-slate-900">{leads.filter(l => l.priority === 'Hot').length}</p>
                    </div>
                    
                    <div className="bg-white p-5 rounded-[2rem] border border-slate-200/60 shadow-xl shadow-slate-200/20 flex flex-col justify-center min-w-[140px] relative overflow-hidden group hover:border-indigo-200 transition-all">
                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-indigo-50 rounded-full blur-2xl group-hover:scale-150 transition-all duration-700"></div>
                        <div className="flex items-center gap-3 mb-2 opacity-80">
                            <Clock size={18} className="text-indigo-500" />
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Follow Ups</p>
                        </div>
                        <p className="text-3xl font-black text-slate-900">{leads.filter(l => l.followUpDate).length}</p>
                    </div>

                    <div className="bg-white p-5 rounded-[2rem] border border-slate-200/60 shadow-xl shadow-slate-200/20 flex flex-col justify-center min-w-[140px] relative overflow-hidden group hover:border-emerald-200 transition-all">
                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-50 rounded-full blur-2xl group-hover:scale-150 transition-all duration-700"></div>
                        <div className="flex items-center gap-3 mb-2 opacity-80">
                            <Calendar size={18} className="text-emerald-500" />
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Drives</p>
                        </div>
                        <p className="text-3xl font-black text-slate-900">{leads.filter(l => l.preferredDateTime && !['cancelled', 'lost'].includes(l.status)).length}</p>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row items-center gap-4 bg-white/50 p-3 rounded-[2rem] backdrop-blur-md border border-white shadow-lg shadow-slate-200/40">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search by name, phone or vehicle ID..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200/80 shadow-inner shadow-slate-100 rounded-[1.5rem] text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                    />
                </div>
                
                <div className="relative min-w-[200px] w-full md:w-auto">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select 
                        value={filterStage}
                        onChange={(e) => setFilterStage(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200/80 shadow-inner shadow-slate-100 rounded-[1.5rem] text-sm font-black text-indigo-900 uppercase tracking-wider outline-none focus:ring-4 focus:ring-indigo-500/10 cursor-pointer appearance-none"
                    >
                        <option value="All">All Pipelines</option>
                        {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            {/* Premium Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredLeads.map((lead) => (
                    <div 
                        key={lead._id || lead.id} 
                        onClick={() => setSelectedLead(lead)}
                        className="group bg-white rounded-[2rem] p-6 border border-slate-200/60 shadow-xl shadow-slate-200/30 hover:shadow-2xl hover:shadow-indigo-200/40 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-white text-xl shadow-lg border-2 border-white ${lead.priority === 'Hot' ? 'bg-gradient-to-br from-rose-500 to-pink-500 shadow-rose-200' : 'bg-gradient-to-br from-slate-400 to-slate-500 shadow-slate-200'}`}>
                                    {(lead.name || "U")[0]}
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 text-lg group-hover:text-indigo-600 transition-colors leading-tight">{lead.name || "Anonymous"}</h3>
                                    <p className="text-xs font-bold text-slate-500 flex items-center gap-1 mt-1">
                                        <Phone size={12} className="text-indigo-400" /> {lead.phone}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <PriorityBadge priority={lead.priority} />
                                <StageBadge stage={lead.stage} />
                            </div>
                        </div>

                        <div className="flex-1 bg-slate-50/50 rounded-[1.5rem] p-4 space-y-3 mb-6 border border-slate-100">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Lead Score</span>
                                <span className="text-sm font-black text-indigo-600">{lead.score} pts</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${Math.min(lead.score, 100)}%` }} />
                            </div>
                            
                            {lead.vehicleId && (
                                <div className="pt-3 mt-3 border-t border-slate-200 flex items-center gap-2">
                                    <Car size={14} className="text-slate-400" />
                                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{vehiclesMap[lead.vehicleId]?.name || `ID: ${lead.vehicleId.slice(-6)}`}</span>
                                </div>
                            )}
                        </div>

                        {/* Event Tags */}
                        <div className="flex flex-wrap gap-2 mt-auto">
                            {lead.preferredDateTime && isValidDate(lead.preferredDateTime) && !['cancelled', 'lost'].includes(lead.status) && (
                                <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-100/50">
                                    <Car size={12} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{safeFormatDate(lead.preferredDateTime)}</span>
                                </div>
                            )}
                            
                            {lead.followUpDate && isValidDate(lead.followUpDate) && (
                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${isOverdue(lead.followUpDate) ? 'bg-rose-50 text-rose-600 border-rose-100/50' : 'bg-slate-50 text-slate-600 border-slate-200/50'}`}>
                                    <Clock size={12} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{isOverdue(lead.followUpDate) ? 'OVERDUE' : safeFormatDate(lead.followUpDate)}</span>
                                </div>
                            )}

                            {(!lead.preferredDateTime || !isValidDate(lead.preferredDateTime)) && (!lead.followUpDate || !isValidDate(lead.followUpDate)) && (
                                <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-2 py-1.5">No Schedules Defined</div>
                            )}
                        </div>
                    </div>
                ))}
                
                {filteredLeads.length === 0 && (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center opacity-50">
                        <Search size={48} className="text-slate-300 mb-4" />
                        <h3 className="text-xl font-black text-slate-900">No Leads Found</h3>
                        <p className="text-sm font-bold text-slate-500 mt-2">Adjust your filters or search query.</p>
                    </div>
                )}
            </div>

            {/* Premium Center Modal */}
            {selectedLead && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-5xl max-h-[90vh] bg-white rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-300 relative border border-white/20">
                        
                        {/* Mobile Close Button */}
                        <button onClick={() => setSelectedLead(null)} className="md:hidden absolute top-4 right-4 z-50 p-2 bg-white/80 backdrop-blur rounded-full text-slate-400">
                            <XCircle size={24} />
                        </button>

                        {/* Left Column: Intelligence & Controls */}
                        <div className="w-full md:w-[45%] bg-slate-50/50 border-r border-slate-100 p-8 sm:p-10 flex flex-col overflow-y-auto custom-scrollbar">
                            <div className="flex items-center gap-5 pb-8 border-b border-slate-200/60">
                                <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center font-black text-white text-3xl shadow-xl border-4 border-white ${selectedLead.priority === 'Hot' ? 'bg-gradient-to-br from-rose-500 to-pink-500 shadow-rose-200' : 'bg-gradient-to-br from-slate-400 to-slate-500 shadow-slate-200'}`}>
                                    {(selectedLead.name || "U")[0]}
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 leading-none mb-2">{selectedLead.name || "Anonymous"}</h2>
                                    <p className="text-indigo-600 font-black flex items-center gap-1.5 text-sm">
                                        <Phone size={14} /> {selectedLead.phone}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Booking Detail Block */}
                            {selectedLead.vehicleId && (
                                <div className="mt-8 bg-white p-5 rounded-[1.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                        <Car size={12} /> Target Vehicle Interest
                                    </h4>
                                    <p className="font-black text-slate-800 text-lg uppercase">
                                        {vehiclesMap[selectedLead.vehicleId]?.name || 
                                         vehiclesMap[selectedLead.vehicleId]?.attributes?.car_code || 
                                         `Loading Vehicle Info...`}
                                    </p>
                                    
                                    {vehiclesMap[selectedLead.vehicleId]?.price && (
                                        <p className="text-emerald-600 font-black text-sm mt-1">₹{vehiclesMap[selectedLead.vehicleId].price.toLocaleString()}</p>
                                    )}
                                    
                                    {selectedLead.preferredDateTime && isValidDate(selectedLead.preferredDateTime) && (
                                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Test Drive Scheduled</div>
                                            <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-black">
                                                <CheckCircle2 size={12} />
                                                {safeFormatDate(selectedLead.preferredDateTime)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Controls */}
                            <div className="mt-8 space-y-6 flex-1">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Pipeline Stage</label>
                                    <select 
                                        value={selectedLead.stage}
                                        onChange={(e) => handleUpdateLead(selectedLead._id || selectedLead.id, { stage: e.target.value as LeadStage })}
                                        className="w-full p-4 bg-white border border-slate-200 shadow-sm rounded-2xl text-sm font-black text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                    >
                                        {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Priority Rank</label>
                                        <select 
                                            value={selectedLead.priority}
                                            onChange={(e) => handleUpdateLead(selectedLead._id || selectedLead.id, { priority: e.target.value as LeadPriority })}
                                            className="w-full p-4 bg-white border border-slate-200 shadow-sm rounded-2xl text-sm font-black text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                        >
                                            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Follow Up Date</label>
                                        <input 
                                            type="datetime-local"
                                            value={selectedLead.followUpDate && !isNaN(new Date(selectedLead.followUpDate).getTime()) ? format(new Date(selectedLead.followUpDate), "yyyy-MM-dd'T'HH:mm") : ''}
                                            onChange={(e) => handleUpdateLead(selectedLead._id || selectedLead.id, { followUpDate: e.target.value })}
                                            className="w-full p-4 bg-white border border-slate-200 shadow-sm rounded-2xl text-xs font-black text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Assigned Agent</label>
                                    <div className="relative">
                                        <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            type="text"
                                            placeholder="Assign to..."
                                            value={selectedLead.assignedTo || ''}
                                            onChange={(e) => handleUpdateLead(selectedLead._id || selectedLead.id, { assignedTo: e.target.value })}
                                            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 shadow-sm rounded-2xl text-sm font-black text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Customer Intelligence / History */}
                            {((selectedLead.historicalNames && selectedLead.historicalNames.length > 0) || 
                              (selectedLead.interestedVehicles && selectedLead.interestedVehicles.length > 0)) && (
                                <div className="mt-8 space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <TrendingUp size={12} className="text-indigo-500" /> Lead Intelligence
                                    </h4>
                                    
                                    <div className="bg-white/50 rounded-[1.5rem] p-5 border border-slate-200/60 space-y-4 shadow-sm">
                                        {selectedLead.historicalNames && selectedLead.historicalNames.length > 0 && (
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Historical Names</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedLead.historicalNames.map((n, i) => (
                                                        <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black border border-indigo-100/50">
                                                            {n}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {selectedLead.interestedVehicles && selectedLead.interestedVehicles.length > 0 && (
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Interested Vehicles</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedLead.interestedVehicles.map((vId, i) => (
                                                        <span key={i} className="px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-black border border-amber-100/50">
                                                            {getVehicleDisplayName(vId)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {selectedLead.historicalBookings && selectedLead.historicalBookings.length > 0 && (
                                            <div className="pt-2">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Past Bookings</p>
                                                <div className="space-y-2">
                                                    {selectedLead.historicalBookings.map((b, i) => (
                                                        <div key={i} className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-100">
                                                            <div className="flex items-center gap-2">
                                                                <Calendar size={12} className="text-indigo-400" />
                                                                <span className="text-[10px] font-bold text-slate-600">{formatSlot(b.date)}</span>
                                                            </div>
                                                            <span className="text-[9px] font-black uppercase text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md">
                                                                {getVehicleDisplayName(b.carId)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column: Interaction & Logs */}
                        <div className="w-full md:w-[55%] flex flex-col h-full max-h-[90vh]">
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10 hidden md:flex">
                                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                    <History className="text-indigo-500" /> Interaction Log
                                </h3>
                                <button onClick={() => setSelectedLead(null)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                                    <XCircle size={24} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30 custom-scrollbar">
                                <div className="relative mb-10">
                                    <textarea 
                                        placeholder="Add internal notes or log a call summary here..."
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                        className="w-full h-32 p-5 bg-white border border-slate-200 shadow-sm rounded-[1.5rem] text-sm font-medium text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all resize-none"
                                    />
                                    <button 
                                        onClick={handleAddCallLog}
                                        disabled={!newNote}
                                        className="absolute bottom-5 right-5 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-slate-900/20 active:scale-95 transition-all disabled:opacity-50 hover:bg-indigo-600 disabled:hover:bg-slate-900"
                                    >
                                        Log It
                                    </button>
                                </div>

                                <div className="space-y-5">
                                    {selectedLead.callLogs.slice().reverse().map((log, i) => (
                                        <div key={i} className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm relative group overflow-hidden">
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-100 group-hover:bg-indigo-400 transition-colors"></div>
                                            <div className="flex items-center justify-between mb-3 ml-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-1 rounded uppercase tracking-widest">{log.agent || "System"}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                        <Clock size={10} /> {safeFormatDate(log.date)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => {
                                                            setEditingLogId(log._id || null);
                                                            setEditNote(log.note);
                                                        }}
                                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                    >
                                                        <Edit size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={() => log._id && handleDeleteCallLog(log._id)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            {editingLogId === log._id ? (
                                                <div className="ml-2 space-y-3">
                                                    <textarea 
                                                        value={editNote}
                                                        onChange={(e) => setEditNote(e.target.value)}
                                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                                                    />
                                                    <div className="flex justify-end gap-2">
                                                        <button 
                                                            onClick={() => setEditingLogId(null)}
                                                            className="px-3 py-1.5 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button 
                                                            onClick={() => log._id && handleUpdateCallLog(log._id)}
                                                            className="px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg shadow-lg shadow-indigo-200"
                                                        >
                                                            Save Changes
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-sm font-medium text-slate-600 leading-relaxed ml-2 whitespace-pre-wrap">{log.note}</p>
                                            )}
                                        </div>
                                    ))}
                                    {selectedLead.callLogs.length === 0 && (
                                        <div className="text-center py-10 opacity-50">
                                            <History size={32} className="mx-auto text-slate-300 mb-3" />
                                            <p className="text-sm font-bold text-slate-500">No interaction logs yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons Footer */}
                            <div className="p-8 bg-white border-t border-slate-100 flex gap-4 sticky bottom-0 z-10 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                                <a 
                                    href={`https://wa.me/${selectedLead.phone.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex-1 bg-emerald-500 text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 hover:bg-emerald-600 hover:-translate-y-0.5 transition-all active:scale-95 text-center"
                                >
                                    <MessageCircle size={20} /> <span className="hidden sm:inline">WhatsApp Message</span><span className="sm:hidden">Message</span>
                                </a>
                                <a 
                                    href={`tel:${selectedLead.phone.replace(/[^0-9]/g, '')}`}
                                    className="flex-1 bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all active:scale-95 text-center"
                                >
                                    <Phone size={20} /> <span className="hidden sm:inline">Call Client</span><span className="sm:hidden">Call</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
