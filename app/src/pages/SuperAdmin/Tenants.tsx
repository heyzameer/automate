import React, { useState } from 'react';
import {
  Plus, Search, Loader2, Edit2, MessageSquare, X, Save,
  CreditCard, Send, ToggleLeft, ToggleRight, Power, ChevronDown, ChevronUp,
  Users, Bot, Zap, Shield, Star, Crown
} from 'lucide-react';
import { useTenants } from '../../hooks/useTenants';
import { Tenant } from '../../types';
import api from '../../lib/api';
import toast from 'react-hot-toast';

// ─── Plan Definitions ────────────────────────────────────────────────────────

const PLANS = [
  {
    key: 'trial', emoji: '🆓', label: 'Trial', price: 'Free',
    badge: 'bg-slate-100 text-slate-600',
    limits: { maxCars: 20, maxLeads: 100, maxStaff: 1, maxCampaignsPerMonth: 0 },
    features: { customWelcome: false, emailAlerts: false, analyticsLevel: 'none', prioritySupport: false, dedicatedSupport: false, emailCampaigns: false, newArrivalBroadcast: false, leadScoring: false },
  },
  {
    key: 'basic', emoji: '💼', label: 'Basic', price: '₹999/mo',
    badge: 'bg-blue-100 text-blue-700',
    limits: { maxCars: 50, maxLeads: 500, maxStaff: 2, maxCampaignsPerMonth: 2 },
    features: { customWelcome: true, emailAlerts: false, analyticsLevel: 'basic', prioritySupport: false, dedicatedSupport: false, emailCampaigns: false, newArrivalBroadcast: false, leadScoring: false },
  },
  {
    key: 'pro', emoji: '🚀', label: 'Pro', price: '₹2,499/mo',
    badge: 'bg-indigo-100 text-indigo-700',
    limits: { maxCars: 200, maxLeads: 2000, maxStaff: 5, maxCampaignsPerMonth: 10 },
    features: { customWelcome: true, emailAlerts: true, analyticsLevel: 'advanced', prioritySupport: true, dedicatedSupport: false, emailCampaigns: true, newArrivalBroadcast: true, leadScoring: true },
  },
  {
    key: 'enterprise', emoji: '🏢', label: 'Enterprise', price: '₹5,999/mo',
    badge: 'bg-amber-100 text-amber-700',
    limits: { maxCars: 999999, maxLeads: 999999, maxStaff: 999999, maxCampaignsPerMonth: 999999 },
    features: { customWelcome: true, emailAlerts: true, analyticsLevel: 'full', prioritySupport: true, dedicatedSupport: true, emailCampaigns: true, newArrivalBroadcast: true, leadScoring: true },
  },
  {
    key: 'custom', emoji: '⚙️', label: 'Custom', price: 'Configure',
    badge: 'bg-rose-100 text-rose-700',
    limits: { maxCars: 50, maxLeads: 500, maxStaff: 2, maxCampaignsPerMonth: 2 },
    features: { customWelcome: false, emailAlerts: false, analyticsLevel: 'basic', prioritySupport: false, dedicatedSupport: false, emailCampaigns: false, newArrivalBroadcast: false, leadScoring: false },
  },
];

const planBadgeStyle: Record<string, string> = {
  trial: 'bg-slate-100 text-slate-600',
  basic: 'bg-blue-100 text-blue-700',
  pro: 'bg-indigo-100 text-indigo-700',
  enterprise: 'bg-amber-100 text-amber-700',
  custom: 'bg-rose-100 text-rose-700',
};

const DEFAULT_CUSTOM_LIMITS = { maxCars: 50, maxLeads: 500, maxStaff: 2, maxCampaignsPerMonth: 2 };
const DEFAULT_CUSTOM_FEATURES = { customWelcome: false, emailAlerts: false, analyticsLevel: 'basic' as const, prioritySupport: false, dedicatedSupport: false, emailCampaigns: false, newArrivalBroadcast: false, leadScoring: false };

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
  const { tenants, loading, saving, toggleStatus, updatePlan, addTenant, assignBot, fetchTenants } = useTenants();
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('All Plans');

  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [botModalTenant, setBotModalTenant] = useState<Tenant | null>(null);
  const [payModalTenant, setPayModalTenant] = useState<Tenant | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [selectedPlanKey, setSelectedPlanKey] = useState('basic');
  const [expiryDate, setExpiryDate] = useState('');
  const [customLimits, setCustomLimits] = useState({ ...DEFAULT_CUSTOM_LIMITS });
  const [customFeatures, setCustomFeatures] = useState<any>({ ...DEFAULT_CUSTOM_FEATURES });
  const [showCustomConfig, setShowCustomConfig] = useState(false);

  const [botForm, setBotForm] = useState({ phoneNumberId: '', accessToken: '', verifyToken: '' });
  const [payForm, setPayForm] = useState({ amount: '', note: '' });
  const [addForm, setAddForm] = useState({
    name: '', email: '', phone: '', password: '', fullName: '',
    expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
  });
  const [savingPlan, setSavingPlan] = useState(false);
  const [sendingPay, setSendingPay] = useState(false);
  const [togglingBot, setTogglingBot] = useState<string | null>(null);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const openEditModal = (tenant: Tenant) => {
    setEditingTenant(tenant);
    const planKey = String(tenant.plan || 'basic').toLowerCase();
    setSelectedPlanKey(planKey);
    setExpiryDate(new Date(String(tenant.expiryDate)).toISOString().split('T')[0]);
    setShowCustomConfig(planKey === 'custom');

    if (planKey === 'custom') {
      setCustomLimits({ ...DEFAULT_CUSTOM_LIMITS, ...(tenant as any).limits });
      setCustomFeatures({ ...DEFAULT_CUSTOM_FEATURES, ...(tenant as any).features });
    }
  };

  const openBotModal = (tenant: Tenant) => {
    setBotModalTenant(tenant);
    setBotForm({
      phoneNumberId: (tenant as any).whatsappConfig?.phoneNumberId || '',
      accessToken: (tenant as any).whatsappConfig?.accessToken || '',
      verifyToken: (tenant as any).whatsappConfig?.verifyToken || '',
    });
  };

  const handlePlanSelect = (key: string) => {
    setSelectedPlanKey(key);
    setShowCustomConfig(key === 'custom');
    if (key === 'custom') {
      const preset = PLANS.find(p => p.key === 'custom')!;
      setCustomLimits({ ...preset.limits });
      setCustomFeatures({ ...preset.features });
    }
  };

  const handleUpdatePlan = async () => {
    if (!editingTenant) return;
    setSavingPlan(true);
    try {
      const plan = PLANS.find(p => p.key === selectedPlanKey)!;
      const limits = selectedPlanKey === 'custom' ? customLimits : plan.limits;
      const features = selectedPlanKey === 'custom' ? customFeatures : plan.features;
      const payload = { plan: selectedPlanKey.toUpperCase(), limits, features, expiryDate: new Date(expiryDate).toISOString() };
      await updatePlan(String(editingTenant._id || editingTenant.id), payload);
      setEditingTenant(null);
      toast.success('Plan updated!');
    } catch {
      toast.error('Failed to update plan');
    } finally {
      setSavingPlan(false);
    }
  };

  const handleToggleBot = async (tenant: Tenant) => {
    const tid = String(tenant._id || tenant.id);
    const currentState = (tenant as any).whatsappConfig?.botEnabled ?? true;
    const newState = !currentState;
    setTogglingBot(tid);
    try {
      await api.patch(`/super/tenants/${tid}/bot-status`, { botEnabled: newState });
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
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan</th>
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
                    <td className="px-8 py-5">
                      <span className={`text-xs font-black uppercase tracking-tighter px-2.5 py-1 rounded-lg ${planBadgeStyle[String(tenant.plan || 'basic').toLowerCase()] || 'bg-slate-100 text-slate-600'}`}>
                        {tenant.plan || 'Basic'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      {!botActive ? (
                        <span className="text-[10px] font-black text-slate-400 uppercase">Not Configured</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleBot(tenant)}
                            disabled={togglingBot === tid}
                            title={botEnabled ? 'Click to disable bot' : 'Click to enable bot'}
                            className={`flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-xl transition-all ${botEnabled ? 'bg-emerald-50 text-emerald-700 hover:bg-rose-50 hover:text-rose-600' : 'bg-rose-50 text-rose-600 hover:bg-emerald-50 hover:text-emerald-700'}`}
                          >
                            {togglingBot === tid ? <Loader2 size={12} className="animate-spin" /> : <Bot size={12} />}
                            {botEnabled ? 'Bot ON' : 'Bot OFF'}
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-5 text-xs font-bold text-slate-600">
                      {new Date(tenant.expiryDate).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-5 text-right space-x-2">
                      <button onClick={() => setPayModalTenant(tenant)} title="Send Payment Request" className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"><CreditCard size={16} /></button>
                      <button onClick={() => openBotModal(tenant)} title="WhatsApp Config" className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"><MessageSquare size={16} /></button>
                      <button onClick={() => openEditModal(tenant)} title="Manage Plan" className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 size={16} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────── PLAN MANAGEMENT MODAL ─────────── */}
      {editingTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl p-8 space-y-6 my-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">Plan Management</h2>
                <p className="text-xs font-bold text-slate-400 mt-1">{editingTenant.name}</p>
              </div>
              <button onClick={() => setEditingTenant(null)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"><X size={20} /></button>
            </div>

            {/* Plan Selector */}
            <div className="grid grid-cols-5 gap-2">
              {PLANS.map(plan => (
                <button
                  key={plan.key}
                  onClick={() => handlePlanSelect(plan.key)}
                  className={`p-3 rounded-2xl border-2 text-center transition-all ${selectedPlanKey === plan.key ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-100 hover:border-slate-200'}`}
                >
                  <div className="text-xl mb-1">{plan.emoji}</div>
                  <div className="text-[10px] font-black text-slate-700">{plan.label}</div>
                  <div className={`text-[9px] font-bold mt-1 px-1 py-0.5 rounded ${plan.badge}`}>{plan.price}</div>
                </button>
              ))}
            </div>

            {/* Plan Summary (non-custom) */}
            {selectedPlanKey !== 'custom' && (() => {
              const p = PLANS.find(pl => pl.key === selectedPlanKey)!;
              return (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 grid grid-cols-2 gap-3 text-xs font-bold text-slate-700">
                  <div className="flex justify-between"><span className="text-slate-400">Cars</span><span>{p.limits.maxCars >= 999999 ? '∞' : p.limits.maxCars}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Leads/mo</span><span>{p.limits.maxLeads >= 999999 ? '∞' : p.limits.maxLeads}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Staff</span><span>{p.limits.maxStaff >= 999999 ? '∞' : p.limits.maxStaff}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Campaigns/mo</span><span>{p.limits.maxCampaignsPerMonth >= 999999 ? '∞' : p.limits.maxCampaignsPerMonth}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Analytics</span><span className="capitalize">{p.features.analyticsLevel}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Email Campaigns</span><span>{p.features.emailCampaigns ? '✅' : '❌'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Lead Scoring</span><span>{p.features.leadScoring ? '✅' : '❌'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Priority Support</span><span>{p.features.prioritySupport ? '✅' : '❌'}</span></div>
                </div>
              );
            })()}

            {/* Custom Plan Configurator */}
            {selectedPlanKey === 'custom' && (
              <div className="border border-rose-200 bg-rose-50/30 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setShowCustomConfig(v => !v)}
                  className="w-full flex items-center justify-between px-6 py-4 text-sm font-black text-rose-700"
                >
                  <span className="flex items-center gap-2"><Zap size={14} /> Configure Custom Limits & Features</span>
                  {showCustomConfig ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showCustomConfig && (
                  <div className="px-6 pb-6 space-y-6">
                    {/* Limits */}
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Usage Limits</p>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { key: 'maxCars', label: 'Max Cars' },
                          { key: 'maxLeads', label: 'Max Leads/mo' },
                          { key: 'maxStaff', label: 'Max Staff' },
                          { key: 'maxCampaignsPerMonth', label: 'Campaigns/mo' },
                        ].map(({ key, label }) => (
                          <div key={key}>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">{label}</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={0}
                                value={(customLimits as any)[key]}
                                onChange={e => setCustomLimits((prev: any) => ({ ...prev, [key]: Number(e.target.value) }))}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold"
                              />
                              <button
                                onClick={() => setCustomLimits((prev: any) => ({ ...prev, [key]: 999999 }))}
                                className="text-[10px] font-black text-indigo-600 whitespace-nowrap hover:underline"
                              >∞</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Feature Toggles */}
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Feature Access</p>
                      <div className="space-y-3">
                        {[
                          { key: 'customWelcome', label: 'Custom Greeting Message' },
                          { key: 'emailAlerts', label: 'Email Alerts' },
                          { key: 'emailCampaigns', label: 'Email Campaigns' },
                          { key: 'newArrivalBroadcast', label: 'New Arrival Auto-Broadcast' },
                          { key: 'leadScoring', label: 'Lead Scoring & Priority' },
                          { key: 'prioritySupport', label: 'Priority Support' },
                          { key: 'dedicatedSupport', label: 'Dedicated Account Manager' },
                        ].map(({ key, label }) => (
                          <div key={key} className="flex items-center justify-between py-1">
                            <span className="text-sm font-bold text-slate-700">{label}</span>
                            <Toggle
                              value={(customFeatures as any)[key]}
                              onChange={v => setCustomFeatures((prev: any) => ({ ...prev, [key]: v }))}
                            />
                          </div>
                        ))}

                        <div className="flex items-center justify-between py-1">
                          <span className="text-sm font-bold text-slate-700">Analytics Level</span>
                          <select
                            value={customFeatures.analyticsLevel}
                            onChange={e => setCustomFeatures((prev: any) => ({ ...prev, analyticsLevel: e.target.value as any }))}
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700"
                          >
                            <option value="none">None</option>
                            <option value="basic">Basic</option>
                            <option value="advanced">Advanced</option>
                            <option value="full">Full</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Expiry Date */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Expiry Date</label>
              <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm" />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setEditingTenant(null)} className="px-5 py-2.5 font-bold text-slate-500 hover:bg-slate-50 rounded-xl">Cancel</button>
              <button onClick={handleUpdatePlan} disabled={savingPlan} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50">
                {savingPlan ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Apply Plan
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* ─────────── BOT CONFIG MODAL ─────────── */}
      {botModalTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black">WhatsApp Setup</h2>
                <p className="text-xs font-bold text-slate-400">Linking Meta API for {botModalTenant.name}</p>
              </div>
              <button onClick={() => setBotModalTenant(null)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Phone Number ID</label>
                <input value={botForm.phoneNumberId} onChange={e => setBotForm({ ...botForm, phoneNumberId: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold" placeholder="1052..." />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Verify Token</label>
                <input value={botForm.verifyToken} onChange={e => setBotForm({ ...botForm, verifyToken: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold" placeholder="carbot_verify_..." />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Meta Access Token</label>
                <textarea rows={3} value={botForm.accessToken} onChange={e => setBotForm({ ...botForm, accessToken: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-mono text-[10px]" placeholder="EAA..." />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setBotModalTenant(null)} className="px-4 py-2 font-bold text-slate-400">Cancel</button>
              <button onClick={handleAssignBot} className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2"><Bot size={14} /> Deploy Bot</button>
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
              <input placeholder="Password" type="password" value={addForm.password} onChange={e => setAddForm({ ...addForm, password: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold" required />
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
