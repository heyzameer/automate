import React, { useState } from 'react';
import { 
  Plus, Search, ToggleLeft, ToggleRight, Calendar, Loader2, Trash2, Edit2, X, Save
} from 'lucide-react';
import { useTenants } from '../../hooks/useTenants';
import { Tenant } from '../../types';

const TenantList = () => {
  const { tenants, loading, saving, toggleStatus, updatePlan, addTenant } = useTenants();
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('All Plans');
  
  // Modal State
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ plan: 'basic', maxCars: 50, maxLeads: 100, expiryDate: '' });
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    fullName: '',
    expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
  });

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    await toggleStatus(id, currentStatus);
  };

  const openEditModal = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setEditForm({
      plan: String(tenant.plan || 'basic'),
      maxCars: Number((tenant.limits as { maxCars?: number })?.maxCars || 50),
      maxLeads: Number((tenant.limits as { maxLeads?: number })?.maxLeads || 100),
      expiryDate: new Date(String(tenant.expiryDate)).toISOString().split('T')[0]
    });
  };

  const closeEditModal = () => {
    setEditingTenant(null);
    setEditForm({ plan: 'basic', maxCars: 50, maxLeads: 100, expiryDate: '' });
  };

  const handleUpdateTenant = async () => {
    if (!editingTenant) return;
    const payload = {
      plan: editForm.plan.toUpperCase(),
      limits: {
        maxCars: Number(editForm.maxCars),
        maxLeads: Number(editForm.maxLeads)
      },
      expiryDate: new Date(editForm.expiryDate).toISOString()
    };
    await updatePlan(String(editingTenant._id || editingTenant.id), payload);
    closeEditModal();
  };

  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      tenantData: {
        name: addForm.name,
        expiryDate: new Date(addForm.expiryDate).toISOString()
      },
      adminData: {
        fullName: addForm.fullName,
        email: addForm.email,
        phone: addForm.phone,
        password: addForm.password
      }
    };
    const success = await addTenant(payload);
    if (success) {
      setIsAddModalOpen(false);
      setAddForm({
        name: '', email: '', phone: '', password: '', fullName: '',
        expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
      });
    }
  };

  const filteredTenants = tenants.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) || 
      (t.slug && t.slug.toLowerCase().includes(search.toLowerCase()));
    const matchesPlan = planFilter === 'All Plans' || t.plan === planFilter.toUpperCase();
    return matchesSearch && matchesPlan;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Showrooms</h1>
          <p className="text-slate-500 font-medium mt-1">Manage partner dealerships and their active subscriptions.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 transform hover:-translate-y-0.5 active:translate-y-0 text-sm"
        >
          <Plus size={18} />
          Add Showroom
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row items-center gap-4 bg-slate-50/30">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or slug..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all text-sm font-medium"
            />
          </div>
          <select 
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-2xl px-6 py-3 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all text-sm font-bold text-slate-600"
          >
            <option>All Plans</option>
            <option>Basic</option>
            <option>Pro</option>
            <option>Enterprise</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Showroom</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan Details</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Expiry</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
                    <p className="text-slate-500 font-medium mt-4">Syncing with global registry...</p>
                  </td>
                </tr>
              ) : filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-medium">
                    No showrooms matched your search.
                  </td>
                </tr>
              ) : filteredTenants.map((tenant) => (
                <tr key={tenant._id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{tenant.name}</span>
                      <span className="text-xs font-bold text-indigo-600 mt-0.5 tracking-tight group-hover:underline cursor-pointer">
                        automoto.ai/{tenant.slug || 'slug-pending'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                        tenant.plan === 'ENTERPRISE' ? 'bg-purple-100 text-purple-700' :
                        tenant.plan === 'PRO' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                        {tenant.plan}
                        </span>
                        <div className="h-1 w-1 bg-slate-300 rounded-full"></div>
                        <span className="text-xs font-bold text-slate-400">{tenant.limits?.maxCars || 50} Cars • {tenant.limits?.maxLeads || 100} Leads</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <button 
                        onClick={() => handleToggleStatus(tenant._id || tenant.id, tenant.isActive)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all font-bold text-xs ${
                        tenant.isActive 
                            ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' 
                            : 'text-rose-600 bg-rose-50 hover:bg-rose-100'
                        }`}
                    >
                        {tenant.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                        {tenant.isActive ? 'Active' : 'Halted'}
                    </button>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar size={14} className="text-slate-400" />
                      <span className={`text-xs font-bold ${new Date(tenant.expiryDate) < new Date() ? 'text-rose-600' : ''}`}>
                          {new Date(tenant.expiryDate).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                        <button 
                            onClick={() => openEditModal(tenant)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        >
                            <Edit2 size={16} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                            <Trash2 size={16} />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900">Manage Subscription</h2>
              <button onClick={closeEditModal} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
                <div>
                    <span className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Showroom Name</span>
                    <p className="font-bold text-slate-900">{editingTenant.name}</p>
                </div>

                <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Plan Tier</label>
                    <select 
                        value={editForm.plan.toLowerCase()}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, plan: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                        <option value="basic">Basic Plan</option>
                        <option value="pro">Pro Plan</option>
                        <option value="enterprise">Enterprise Plan</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Max Cars</label>
                        <input 
                            type="number" 
                            min="1"
                            value={editForm.maxCars}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, maxCars: Number(e.target.value) }))}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Max Leads</label>
                        <input 
                            type="number" 
                            min="1"
                            value={editForm.maxLeads}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, maxLeads: Number(e.target.value) }))}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Expiry Date</label>
                    <input 
                        type="date" 
                        value={editForm.expiryDate}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, expiryDate: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={closeEditModal}
                className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateTenant}
                disabled={saving}
                className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Plan Details
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900">Add New Showroom</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddTenant}>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Showroom Name</label>
                    <input 
                        type="text" 
                        required
                        value={addForm.name}
                        onChange={(e) => setAddForm((prev) => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="e.g. Royal Motors"
                    />
                </div>

                <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Admin Full Name</label>
                    <input 
                        type="text" 
                        required
                        value={addForm.fullName}
                        onChange={(e) => setAddForm((prev) => ({ ...prev, fullName: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="e.g. John Doe"
                    />
                </div>

                <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Admin Email</label>
                    <input 
                        type="email" 
                        required
                        value={addForm.email}
                        onChange={(e) => setAddForm((prev) => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="admin@example.com"
                    />
                </div>

                <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Admin Phone</label>
                    <input 
                        type="text" 
                        required
                        value={addForm.phone}
                        onChange={(e) => setAddForm((prev) => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="+91 9999999999"
                    />
                </div>

                <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Password</label>
                    <input 
                        type="password" 
                        required
                        minLength={8}
                        value={addForm.password}
                        onChange={(e) => setAddForm((prev) => ({ ...prev, password: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="Min 8 characters"
                    />
                </div>

                <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Initial Expiry</label>
                    <input 
                        type="date" 
                        required
                        value={addForm.expiryDate}
                        onChange={(e) => setAddForm((prev) => ({ ...prev, expiryDate: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Create Showroom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantList;
