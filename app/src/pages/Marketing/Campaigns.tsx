import React, { useState, useEffect } from 'react';
import {
    Send,
    Users,
    MessageSquare,
    Calendar,
    Plus,
    BarChart3,
    Clock,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Search,
    Filter,
    X,
    Car,
    Trash2,
    Edit,
    RotateCcw
} from 'lucide-react';
import { campaignsService, Campaign } from '../../services/campaigns.service';
import { vehicleService, Vehicle } from '../../services/vehicle.service';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const AUDIENCES = [
    { id: 'all', name: 'All Leads', icon: Users, color: 'bg-blue-500' },
    { id: 'hot', name: 'Hot Leads', icon: CheckCircle2, color: 'bg-emerald-500' },
    { id: 'cold', name: 'Cold Leads', icon: AlertCircle, color: 'bg-rose-500' },
    { id: 'customers', name: 'Old Customers', icon: Users, color: 'bg-indigo-500' },
];

export default function Campaigns() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [executingId, setExecutingId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);

    // New Campaign Form State
    const [newCampaign, setNewCampaign] = useState<Partial<Campaign>>({
        name: '',
        type: 'whatsapp',
        audience: 'all',
        message: '',
        vehicleIds: [],
    });

    useEffect(() => {
        fetchCampaigns();
        fetchVehicles();
    }, []);

    const fetchCampaigns = async () => {
        try {
            const data = await campaignsService.getCampaigns();
            setCampaigns(data);
        } catch (error) {
            console.error("Campaign load error", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchVehicles = async () => {
        try {
            const data = await vehicleService.getAll();
            setVehicles(data);
        } catch (error) {
            console.error("Vehicle load error", error);
        }
    };

    const handleCreateOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Automatically append vehicle details to message if cars are selected
            let finalMessage = newCampaign.message;
            if (newCampaign.vehicleIds && newCampaign.vehicleIds.length > 0 && !editingId) {
                const selectedCars = vehicles.filter(v => newCampaign.vehicleIds?.includes(v._id!));
                const carText = selectedCars.map(v => `\n- ${v.attributes.brand} ${v.attributes.model} (₹${Number(v.attributes.price).toLocaleString()})`).join('');
                finalMessage += `\n\nFeatured Vehicles:${carText}`;
            }

            if (editingId) {
                await campaignsService.updateCampaign(editingId, newCampaign);
                toast.success("Campaign updated");
            } else {
                await campaignsService.createCampaign({
                    ...newCampaign,
                    message: finalMessage
                });
                toast.success("Campaign created as draft");
            }
            
            setIsCreateModalOpen(false);
            setEditingId(null);
            setNewCampaign({ name: '', type: 'whatsapp', audience: 'all', message: '', vehicleIds: [] });
            fetchCampaigns();
        } catch (error) {
            toast.error(editingId ? "Failed to update campaign" : "Failed to create campaign");
        }
    };

    const handleExecute = async (id: string) => {
        setExecutingId(id);
        try {
            await campaignsService.executeCampaign(id);
            toast.success("Campaign broadcasted successfully!");
            fetchCampaigns();
        } catch (error) {
            toast.error("Failed to send broadcast");
        } finally {
            setExecutingId(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this campaign? History will be lost.")) return;
        try {
            await campaignsService.deleteCampaign(id);
            toast.success("Campaign deleted");
            fetchCampaigns();
        } catch (error) {
            toast.error("Failed to delete campaign");
        }
    };

    const handleReopen = async (id: string) => {
        try {
            await campaignsService.reopenCampaign(id);
            toast.success("Campaign reopened as draft");
            fetchCampaigns();
        } catch (error) {
            toast.error("Failed to reopen campaign");
        }
    };

    const startEdit = (camp: Campaign) => {
        setEditingId(camp._id!);
        setNewCampaign({
            name: camp.name,
            type: camp.type,
            audience: camp.audience,
            message: camp.message,
            vehicleIds: camp.vehicleIds || []
        });
        setIsCreateModalOpen(true);
    };

    const handleAudienceChange = async (id: string, newAudience: any) => {
        try {
            await campaignsService.updateCampaign(id, { audience: newAudience });
            toast.success("Audience updated");
            fetchCampaigns();
        } catch (error) {
            toast.error("Failed to update audience");
        }
    };

    const toggleVehicleSelection = (id: string) => {
        setNewCampaign(prev => {
            const current = prev.vehicleIds || [];
            if (current.includes(id)) {
                return { ...prev, vehicleIds: current.filter(vId => vId !== id) };
            } else {
                return { ...prev, vehicleIds: [...current, id] };
            }
        });
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Marketing Hub</h1>
                    <p className="text-slate-500 font-medium text-sm">Create hyper-personalized broadcasts</p>
                </div>
                <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center justify-center px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                >
                    <Plus className="w-5 h-5 mr-3" />
                    Create Campaign
                </button>
            </div>

            {/* Campaign Cards */}
            {loading ? (
                <div className="h-96 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs animate-pulse">Syncing Campaigns...</p>
                </div>
            ) : campaigns.length === 0 ? (
                <div className="bg-white rounded-[3rem] py-32 text-center border-2 border-dashed border-slate-100">
                    <MessageSquare size={48} className="mx-auto text-slate-200 mb-4" />
                    <h3 className="text-xl font-black text-slate-900">No campaigns yet</h3>
                    <p className="text-slate-400 mt-2 mb-8">Start your first broadcast to reach your leads.</p>
                    <button onClick={() => setIsCreateModalOpen(true)} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold">New Campaign</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {campaigns.map((camp) => (
                        <div key={camp._id} className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-50/50 transition-all group relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                                <div className="flex-1 space-y-6">
                                    <div className="flex items-center justify-between">
                                         <div className="flex items-center gap-4">
                                             <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                 camp.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                                                 camp.status === 'failed' ? 'bg-rose-50 text-rose-600' :
                                                 camp.status === 'sending' ? 'bg-indigo-50 text-indigo-600' :
                                                 'bg-slate-100 text-slate-500'
                                             }`}>
                                                 {camp.status}
                                             </span>
                                             <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                 <Calendar size={12} />
                                                 {camp.createdAt ? format(new Date(camp.createdAt), 'dd MMM yyyy') : 'N/A'}
                                             </div>
                                         </div>

                                         <div className="flex items-center gap-2">
                                             {camp.status === 'draft' && (
                                                 <button 
                                                     onClick={() => startEdit(camp)}
                                                     className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                     title="Edit Draft"
                                                  >
                                                     <Edit size={16} />
                                                 </button>
                                             )}
                                             {(camp.status === 'completed' || camp.status === 'failed') && (
                                                <button 
                                                    onClick={() => handleReopen(camp._id!)}
                                                    className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all"
                                                    title="Reopen as Draft"
                                                >
                                                    <RotateCcw size={16} />
                                                </button>
                                             )}
                                             <button 
                                                onClick={() => handleDelete(camp._id!)}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                title="Delete Campaign"
                                             >
                                                <Trash2 size={16} />
                                             </button>
                                         </div>
                                    </div>

                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{camp.name}</h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">{camp.type} Channel •</span>
                                            {camp.status === 'draft' ? (
                                                <select 
                                                    className="bg-transparent border-none text-indigo-600 font-black text-[10px] uppercase tracking-widest outline-none p-0 cursor-pointer hover:bg-indigo-50 rounded px-1"
                                                    value={camp.audience}
                                                    onChange={(e) => handleAudienceChange(camp._id!, e.target.value)}
                                                >
                                                    <option value="all">All Leads</option>
                                                    <option value="hot">Hot Leads</option>
                                                    <option value="cold">Cold Leads</option>
                                                    <option value="customers">Customers</option>
                                                </select>
                                            ) : (
                                                <span className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">{camp.audience} Audience</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 relative">
                                        <p className="text-slate-600 font-medium text-sm leading-relaxed whitespace-pre-wrap italic">
                                            "{camp.message}"
                                        </p>
                                        <MessageSquare size={40} className="absolute -bottom-2 -right-2 text-slate-100 -z-0 opacity-50" />
                                    </div>
                                </div>

                                <div className="lg:w-80 space-y-6">
                                    <div className="bg-slate-900 rounded-[2rem] p-8 text-white">
                                        <div className="flex items-center justify-between mb-8">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Performance</h4>
                                            <BarChart3 size={16} className="text-indigo-400" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-y-6">
                                            <div>
                                                <p className="text-3xl font-black">{camp.stats?.total || 0}</p>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Recipients</p>
                                            </div>
                                            <div>
                                                <p className="text-3xl font-black text-emerald-400">
                                                    {camp.stats?.total ? Math.round(((camp.stats?.sent || 0)/camp.stats.total)*100) : 0}%
                                                </p>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Success</p>
                                            </div>
                                        </div>
                                    </div>

                                    {camp.status === 'draft' && (
                                        <button 
                                            onClick={() => handleExecute(camp._id!)}
                                            disabled={executingId === camp._id}
                                            className="w-full bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3"
                                        >
                                            {executingId === camp._id ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                                            Shoot Campaign
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[3.5rem] w-full max-w-4xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        <div className="p-10 border-b border-slate-50 flex items-center justify-between flex-shrink-0">
                            <div>
                                <h3 className="text-3xl font-black text-slate-900">{editingId ? 'Edit Campaign' : 'New Campaign'}</h3>
                                <p className="text-slate-400 font-medium">{editingId ? 'Refine your message and audience.' : 'Draft a message and select cars to feature.'}</p>
                            </div>
                            <button onClick={() => { setIsCreateModalOpen(false); setEditingId(null); }} className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                            <div className="grid grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Campaign Details</label>
                                    <input 
                                        type="text" 
                                        placeholder="Campaign Name (e.g. June SUV Bonanza)"
                                        className="w-full px-8 py-5 bg-slate-50 rounded-2xl font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-50 transition-all border-none"
                                        value={newCampaign.name}
                                        onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                                    />
                                    <select 
                                        className="w-full px-8 py-5 bg-slate-50 rounded-2xl font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-50 transition-all border-none"
                                        value={newCampaign.audience}
                                        onChange={(e) => setNewCampaign({...newCampaign, audience: e.target.value as any})}
                                    >
                                        <option value="all">Broadcast to All leads</option>
                                        <option value="hot">Focus on Hot leads</option>
                                        <option value="customers">Remarket to Past Customers</option>
                                    </select>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Personalized Message</label>
                                    <div className="relative">
                                        <textarea 
                                            rows={5}
                                            placeholder="Hi {name}, hope you are doing well! We have some amazing vehicles in stock..."
                                            className="w-full px-8 py-5 bg-slate-50 rounded-[2rem] font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-50 transition-all border-none resize-none"
                                            value={newCampaign.message}
                                            onChange={(e) => setNewCampaign({...newCampaign, message: e.target.value})}
                                        />
                                        <div className="absolute top-4 right-4 text-[10px] font-black text-indigo-400 bg-white px-3 py-1 rounded-full shadow-sm">
                                            {`{name}`} Friendly
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Multi-Car Selector */}
                            {!editingId && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Vehicles to Feature ({newCampaign.vehicleIds?.length || 0})</label>
                                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">Optional</span>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {vehicles.map(v => (
                                            <div 
                                                key={v._id}
                                                onClick={() => toggleVehicleSelection(v._id!)}
                                                className={`p-4 rounded-3xl border-2 transition-all cursor-pointer flex items-center gap-4 ${
                                                    newCampaign.vehicleIds?.includes(v._id!) 
                                                    ? 'border-indigo-600 bg-indigo-50' 
                                                    : 'border-slate-100 hover:border-indigo-200'
                                                }`}
                                            >
                                                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                    {v.images?.[0] ? <img src={v.images[0]} className="w-full h-full object-cover" /> : <Car size={20} className="text-slate-300" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-black text-slate-900 truncate">{v.attributes.brand} {v.attributes.model}</p>
                                                    <p className="text-[10px] font-bold text-slate-400">₹{Number(v.attributes.price).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {vehicles.length === 0 && <p className="text-slate-400 text-xs italic">No vehicles available to select.</p>}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-10 border-t border-slate-50 bg-slate-50/50 flex gap-6 flex-shrink-0">
                            <button 
                                onClick={() => { setIsCreateModalOpen(false); setEditingId(null); }}
                                className="flex-1 py-5 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-100 transition-all text-center"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleCreateOrUpdate}
                                className="flex-[2] bg-indigo-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                            >
                                {editingId ? 'Save Changes' : 'Create & Save Draft'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
