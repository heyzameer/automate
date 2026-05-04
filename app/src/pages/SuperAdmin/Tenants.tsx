import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import {
  Plus, Search, Loader2, Edit2, MessageSquare, X, Save,
  CreditCard, Send, ToggleLeft, ToggleRight, Power, ChevronDown, ChevronUp, Check,
  Users, Bot, Zap, Shield, Star, Crown, Eye, EyeOff, Circle, LayoutGrid, Calendar
} from 'lucide-react';
import { useTenants } from '../../hooks/useTenants';
import { Tenant } from '../../types';
import api from '../../lib/api';
import toast from 'react-hot-toast';

// Utility for Tailwind class merging
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');

// ─── Plan Definitions ────────────────────────────────────────────────────────

export const PLANS = [
  {
    key: 'none', emoji: '⏳', label: 'No Plan', price: 'N/A',
    badge: 'bg-rose-50 text-rose-400',
    limits: { maxCars: 0, maxLeads: 0 },
    features: { whatsappBot: false, campaigns: false, qrCode: false },
  },
  {
    key: 'trial', emoji: '🆓', label: 'Trial', price: 'Free',
    badge: 'bg-slate-100 text-slate-600',
    limits: { maxCars: 20, maxLeads: 100 },
    features: { whatsappBot: false, campaigns: false, qrCode: false },
  },
  {
    key: 'basic', emoji: '💼', label: 'Basic', price: '₹999/mo',
    badge: 'bg-blue-100 text-blue-700',
    limits: { maxCars: 50, maxLeads: 500 },
    features: { whatsappBot: true, campaigns: false, qrCode: true },
  },
  {
    key: 'pro', emoji: '🚀', label: 'Pro', price: '₹2,499/mo',
    badge: 'bg-indigo-100 text-indigo-700',
    limits: { maxCars: 200, maxLeads: 2000 },
    features: { whatsappBot: true, campaigns: true, qrCode: true },
  },
  {
    key: 'enterprise', emoji: '🏢', label: 'Enterprise', price: '₹5,999/mo',
    badge: 'bg-amber-100 text-amber-700',
    limits: { maxCars: 999999, maxLeads: 999999 },
    features: { whatsappBot: true, campaigns: true, qrCode: true },
  },
  {
    key: 'custom', emoji: '⚙️', label: 'Custom', price: 'Configure',
    badge: 'bg-rose-100 text-rose-700',
    limits: { maxCars: 50, maxLeads: 500 },
    features: { whatsappBot: false, campaigns: false, qrCode: false },
  },
];

const planBadgeStyle: Record<string, string> = {
  trial: 'bg-slate-100 text-slate-600',
  basic: 'bg-blue-100 text-blue-700',
  pro: 'bg-indigo-100 text-indigo-700',
  enterprise: 'bg-amber-100 text-amber-700',
  custom: 'bg-rose-100 text-rose-700',
};

const DEFAULT_CUSTOM_LIMITS = { maxCars: 50 };
const DEFAULT_CUSTOM_FEATURES = { whatsappBot: false, campaigns: false, qrCode: false };

// ─── Toggle Component ─────────────────────────────────────────────────────────
const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
  <button
    type="button"
    onClick={() => onChange(!value)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${value ? 'bg-indigo-600' : 'bg-slate-200'}`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const TenantList = () => {
  const navigate = useNavigate();
  const { tenants, loading, saving, toggleStatus, updatePlan, addTenant, assignBot, fetchTenants } = useTenants();
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('All Plans');

  const [payModalTenant, setPayModalTenant] = useState<Tenant | null>(null);
  const [botModalTenant, setBotModalTenant] = useState<Tenant | null>(null);
  const [botForm, setBotForm] = useState({ phoneNumberId: '', accessToken: '', verifyToken: '' });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [payForm, setPayForm] = useState({ amount: '', note: '' });
  const [addForm, setAddForm] = useState({
    name: '', email: '', phone: '', password: '', fullName: '',
    expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
  });
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [sendingPay, setSendingPay] = useState(false);
  const [togglingBot, setTogglingBot] = useState<string | null>(null);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const openEditModal = (tenant: Tenant) => {
    // Redirect to detail page for plan management
    navigate(ROUTES.SUPER_ADMIN.SHOWROOM_DETAIL(String(tenant._id || tenant.id)));
  };

  const handleToggleBot = async (tenant: Tenant) => {
    const tid = String(tenant._id || tenant.id);
    const currentState = (tenant as any).whatsappConfig?.botEnabled ?? true;
    const newState = !currentState;
    setTogglingBot(tid);
    try {
      // Use the generic update endpoint which is more stable and verified
      await api.patch(`/super/tenants/${tid}`, { 
        whatsappConfig: { botEnabled: newState } 
      });
      toast.success(`Bot ${newState ? 'enabled' : 'disabled'} for ${tenant.name}`);
      await fetchTenants(); // refresh tenant list to reflect new state
    } catch {
      toast.error('Failed to toggle bot status');
    } finally {
      setTogglingBot(null);
    }
  };

  const handleAssignBot = async () => {
    if (!botModalTenant) return;
    await assignBot(String(botModalTenant._id || botModalTenant.id), botForm);
    setBotModalTenant(null);
  };

  const handleSendPayment = async () => {
    if (!payModalTenant || !payForm.amount) return;
    setSendingPay(true);
    try {
      await api.post(`/super/tenants/${payModalTenant._id || payModalTenant.id}/payment-request`, { amount: Number(payForm.amount), note: payForm.note });
      toast.success('Payment request sent!');
      setPayModalTenant(null);
      setPayForm({ amount: '', note: '' });
    } catch {
      toast.error('Failed to send payment request');
    } finally {
      setSendingPay(false);
    }
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
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchesPlan = planFilter === 'All Plans' || t.plan?.toLowerCase() === planFilter.toLowerCase();
    return matchesSearch && matchesPlan;
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Partner Showrooms</h1>
          <p className="text-slate-500 font-medium mt-1">Manage plans, bot control, and billing for every dealership.</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg text-sm">
          <Plus size={18} /> Add Showroom
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row items-center gap-4 bg-slate-50/30">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Search showrooms..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium" />
          </div>
          <select value={planFilter} onChange={e => setPlanFilter(e.target.value)} className="bg-white border border-slate-200 rounded-2xl px-6 py-3 text-sm font-bold text-slate-600">
            <option>All Plans</option>
            <option>Trial</option><option>Basic</option><option>Pro</option><option>Enterprise</option><option>Custom</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Showroom</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">WhatsApp Bot</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Expiry</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={6} className="px-8 py-20 text-center text-slate-400">Loading...</td></tr>
              ) : filteredTenants.map((tenant) => {
                const botEnabled = (tenant as any).whatsappConfig?.botEnabled ?? true;
                const botActive = (tenant as any).whatsappConfig?.isActive;
                const tid = String(tenant._id || tenant.id);
                return (
                  <tr key={tid} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{tenant.name}</span>
                        <span className="text-xs text-indigo-600 font-bold">{tenant.slug}.carbot.ai</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <button onClick={() => toggleStatus(tid, tenant.isActive)} className={`text-xs font-bold px-3 py-1.5 rounded-xl ${tenant.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {tenant.isActive ? '● Active' : '● Disabled'}
                      </button>
                    </td>
                    <td className="px-8 py-5 text-xs font-bold text-slate-500 uppercase italic">
                        {tenant.plan || 'Basic'}
                    </td>
                    <td className="px-8 py-5">
                      {!botActive ? (
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase italic">
                           <Circle size={8} fill="currentColor" className="text-slate-200" /> Not Configured
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleBot(tenant)}
                            disabled={togglingBot === tid}
                            title={botEnabled ? 'Click to disable bot' : 'Click to enable bot'}
                            className={cn(
                                "relative flex items-center gap-2 text-[10px] font-black px-4 py-2 rounded-2xl transition-all duration-500 overflow-hidden group/bot",
                                botEnabled 
                                    ? "bg-emerald-50 text-emerald-600 hover:bg-rose-50 hover:text-rose-600 border border-emerald-100/50" 
                                    : "bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-100"
                            )}
                          >
                            {/* Glowing Pulse for Active Bot */}
                            {botEnabled && (
                                <span className="absolute inset-0 bg-emerald-400/10 animate-pulse" />
                            )}
                            
                            {togglingBot === tid ? (
                                <Loader2 size={12} className="animate-spin" />
                            ) : (
                                <div className={cn(
                                    "w-1.5 h-1.5 rounded-full transition-all duration-500",
                                    botEnabled ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-slate-300"
                                )} />
                            )}
                            
                            <span className="relative z-10 flex items-center gap-1.5">
                                <Bot size={12} className={cn("transition-transform group-hover/bot:scale-110", botEnabled ? "text-emerald-600" : "text-slate-400")} />
                                {botEnabled ? 'BOT ACTIVE' : 'BOT OFFLINE'}
                            </span>
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-5 text-xs font-bold text-slate-600">
                      {new Date(tenant.expiryDate).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link 
                          to={ROUTES.SUPER_ADMIN.SHOWROOM_DETAIL(tid)} 
                          className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-xl transition-all shadow-sm"
                        >
                          <Eye size={12} /> View
                        </Link>
                        <button 
                          onClick={() => setPayModalTenant(tenant)} 
                          className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 hover:bg-amber-600 hover:text-white rounded-xl transition-all shadow-sm"
                        >
                          <CreditCard size={12} /> Bill
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────── PAYMENT REQUEST MODAL ─────────── */}
      {payModalTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">Send Payment Request</h2>
                <p className="text-xs font-bold text-slate-400 mt-1">To: {payModalTenant.name}</p>
              </div>
              <button onClick={() => setPayModalTenant(null)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Amount (₹)</label>
                <input type="number" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-lg" placeholder="999" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Note / Invoice Details</label>
                <textarea rows={3} value={payForm.note} onChange={e => setPayForm({ ...payForm, note: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-medium text-sm resize-none" placeholder="Monthly subscription for Basic plan — April 2026..." />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setPayModalTenant(null)} className="px-5 py-2.5 font-bold text-slate-500">Cancel</button>
              <button onClick={handleSendPayment} disabled={sendingPay || !payForm.amount} className="bg-amber-500 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-amber-600 disabled:opacity-50">
                {sendingPay ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────── ADD SHOWROOM MODAL ─────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black">New Showroom</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddTenant} className="space-y-4">
              <input placeholder="Showroom Name" value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold" required />
              <input placeholder="Admin Full Name" value={addForm.fullName} onChange={e => setAddForm({ ...addForm, fullName: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold" />
              <input placeholder="Email" value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold" required />
              <input placeholder="Phone" value={addForm.phone} onChange={e => setAddForm({ ...addForm, phone: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold" />
              <div className="relative group/pw flex items-center">
                  <input 
                    placeholder="Password" 
                    type={showAddPassword ? "text" : "password"} 
                    value={addForm.password} 
                    onChange={e => setAddForm({ ...addForm, password: e.target.value })} 
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold pr-12" 
                    required 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowAddPassword(!showAddPassword)}
                    className="absolute right-4 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                      {showAddPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 font-bold text-slate-400 py-3">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Onboard
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
