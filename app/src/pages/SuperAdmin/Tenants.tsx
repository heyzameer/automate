import React, { useState } from 'react';
import { 
  Plus, Search, ToggleLeft, ToggleRight, Calendar, Loader2, Trash2, Edit2, X, Save, MessageSquare
} from 'lucide-react';
import { useTenants } from '../../hooks/useTenants';
import { Tenant } from '../../types';

const TenantList = () => {
  const { tenants, loading, saving, toggleStatus, updatePlan, addTenant, assignBot } = useTenants();
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('All Plans');
  
  // Modals State
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [botModalTenant, setBotModalTenant] = useState<Tenant | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Forms State
  const [editForm, setEditForm] = useState({ plan: 'basic', maxCars: 50, maxLeads: 100, expiryDate: '' });
  const [botForm, setBotForm] = useState({ phoneNumberId: '', accessToken: '', verifyToken: '' });
  const [addForm, setAddForm] = useState({
    name: '', email: '', phone: '', password: '', fullName: '',
    expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
  });

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    await toggleStatus(id, currentStatus);
  };

  const openEditModal = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setEditForm({
      plan: String(tenant.plan || 'basic').toLowerCase(),
      maxCars: Number((tenant.limits as any)?.maxCars || 50),
      maxLeads: Number((tenant.limits as any)?.maxLeads || 100),
      expiryDate: new Date(String(tenant.expiryDate)).toISOString().split('T')[0]
    });
  };

  const openBotModal = (tenant: Tenant) => {
    setBotModalTenant(tenant);
    setBotForm({
      phoneNumberId: tenant.whatsappConfig?.phoneNumberId || '',
      accessToken: tenant.whatsappConfig?.accessToken || '',
      verifyToken: tenant.whatsappConfig?.verifyToken || ''
    });
  };

  const handleUpdateTenant = async () => {
    if (!editingTenant) return;
    const payload = {
      plan: editForm.plan.toUpperCase(),
      limits: { maxCars: Number(editForm.maxCars), maxLeads: Number(editForm.maxLeads) },
      expiryDate: new Date(editForm.expiryDate).toISOString()
    };
    await updatePlan(String(editingTenant._id || editingTenant.id), payload);
    setEditingTenant(null);
  };

  const handleAssignBot = async () => {
    if (!botModalTenant) return;
    await assignBot(String(botModalTenant._id || botModalTenant.id), botForm);
    setBotModalTenant(null);
  };

  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      tenantData: { name: addForm.name, expiryDate: new Date(addForm.expiryDate).toISOString() },
      adminData: { fullName: addForm.fullName, email: addForm.email, phone: addForm.phone, password: addForm.password }
    };
    const success = await addTenant(payload);
    if (success) setIsAddModalOpen(false);
  };

  const filteredTenants = tenants.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) || 
      (t.slug && t.slug.toLowerCase().includes(search.toLowerCase()));
    const matchesPlan = planFilter === 'All Plans' || t.plan === planFilter.toUpperCase();
    return matchesSearch && matchesPlan;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight text-[#0f172a]">Partner Showrooms</h1>
          <p className="text-slate-500 font-medium mt-1">Onboard dealerships and manage their AI bot deployments.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg text-sm"
        >
          <Plus size={18} /> Add Showroom
        </button>
      </div>

      {/* Registry Table */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row items-center gap-4 bg-slate-50/30">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm"
            />
          </div>
          <select 
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-2xl px-6 py-3 text-sm font-bold text-slate-600"
          >
            <option>All Plans</option>
            <option>Basic</option><option>Pro</option><option>Enterprise</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Showroom</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Expiry</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="px-8 py-20 text-center text-slate-400">Loading...</td></tr>
              ) : filteredTenants.map((tenant) => (
                <tr key={tenant._id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{tenant.name}</span>
                      <span className="text-xs text-indigo-600 font-bold">{tenant.slug}.carbot.ai</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <button 
                      onClick={() => handleToggleStatus(String(tenant._id || tenant.id), tenant.isActive)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl ${tenant.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}
                    >
                      {tenant.isActive ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-xs font-black uppercase text-slate-500 tracking-tighter bg-slate-100 px-2 py-1 rounded">{tenant.plan}</span>
                  </td>
                  <td className="px-8 py-5 text-xs font-bold text-slate-600">
                    {new Date(tenant.expiryDate).toLocaleDateString()}
                  </td>
                  <td className="px-8 py-5 text-right space-x-2">
                    <button onClick={() => openBotModal(tenant)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"><MessageSquare size={16} /></button>
                    <button onClick={() => openEditModal(tenant)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl p-8 space-y-6">
            <h2 className="text-xl font-black">Plan Management</h2>
            <div className="space-y-4">
              <select value={editForm.plan} onChange={(e)=>setEditForm({...editForm, plan: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl font-bold">
                <option value="basic">Basic</option><option value="pro">Pro</option><option value="enterprise">Enterprise</option>
              </select>
              <input type="date" value={editForm.expiryDate} onChange={(e)=>setEditForm({...editForm, expiryDate: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl font-bold" />
            </div>
            <div className="flex gap-2 justify-end">
                <button onClick={()=>setEditingTenant(null)} className="px-4 py-2 font-bold text-slate-400">Cancel</button>
                <button onClick={handleUpdateTenant} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold">Update Plan</button>
            </div>
          </div>
        </div>
      )}

      {/* Bot Assignment Modal */}
      {botModalTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl p-8 space-y-6 animate-in zoom-in-95 duration-200">
            <div>
                <h2 className="text-xl font-black">WhatsApp Setup</h2>
                <p className="text-xs font-bold text-slate-400">Linking Meta API for {botModalTenant.name}</p>
            </div>
            <div className="space-y-4">
              <input placeholder="Phone Number ID" value={botForm.phoneNumberId} onChange={(e)=>setBotForm({...botForm, phoneNumberId: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl font-bold" />
              <textarea placeholder="Access Token" rows={4} value={botForm.accessToken} onChange={(e)=>setBotForm({...botForm, accessToken: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl font-mono text-[10px]" />
              <input placeholder="Verify Token" value={botForm.verifyToken} onChange={(e)=>setBotForm({...botForm, verifyToken: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl font-bold" />
            </div>
            <div className="flex gap-2 justify-end">
                <button onClick={()=>setBotModalTenant(null)} className="px-4 py-2 font-bold text-slate-400">Cancel</button>
                <button onClick={handleAssignBot} className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold">Sync Bot</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal Placeholder */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
             <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl p-8">
                <h2 className="text-xl font-black mb-6">New Showroom</h2>
                <form onSubmit={handleAddTenant} className="space-y-4">
                    <input placeholder="Name" value={addForm.name} onChange={(e)=>setAddForm({...addForm, name:e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl font-bold" />
                    <input placeholder="Email" value={addForm.email} onChange={(e)=>setAddForm({...addForm, email:e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl font-bold" />
                    <input placeholder="Password" type="password" value={addForm.password} onChange={(e)=>setAddForm({...addForm, password:e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl font-bold" />
                    <div className="flex gap-2">
                        <button type="button" onClick={()=>setIsAddModalOpen(false)} className="flex-1 font-bold text-slate-400">Cancel</button>
                        <button type="submit" className="flex-1 bg-indigo-600 text-white p-3 rounded-xl font-bold">Onboard</button>
                    </div>
                </form>
             </div>
        </div>
      )}
    </div>
  );
};

export default TenantList;
