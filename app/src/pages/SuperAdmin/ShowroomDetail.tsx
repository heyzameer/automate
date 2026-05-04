import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
    ChevronLeft, 
    Shield, 
    ShieldCheck, 
    ShieldAlert,
    Bot, 
    CreditCard, 
    Calendar, 
    Mail, 
    Phone, 
    Globe, 
    Package,
    Activity,
    Settings,
    Loader2,
    CheckCircle2,
    XCircle,
    Power,
    ArrowUpRight,
    Monitor,
    RefreshCw,
    Eye,
    EyeOff,
    Copy,
    Save,
    Check,
    Zap,
    Star,
    Crown,
    X,
    Megaphone
} from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');

const DEFAULT_CUSTOM_LIMITS = { maxCars: 50 };
const DEFAULT_CUSTOM_FEATURES = { whatsappBot: false, campaigns: false, qrCode: false };

const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
  <button
    type="button"
    onClick={() => onChange(!value)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${value ? 'bg-indigo-600' : 'bg-slate-200'}`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);
import { useTenants } from '../../hooks/useTenants';
import { Tenant } from '../../types';
import { ROUTES } from '../../constants/routes';
import { PLANS } from './Tenants';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { API_ENDPOINTS } from '../../constants/endpoints';
import { formatDistanceToNow } from 'date-fns';

interface TenantStats {
    totalStock: number;
    availableStock: number;
    soldStock: number;
    totalLeads: number;
    leadsThisMonth: number;
    recentLeads: Array<{ _id: string; name: string; phone: string; stage: string; priority: string; createdAt: string }>;
}

const ShowroomDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { getTenant, verifyTenant, toggleStatus, updatePlan, assignBot, saving, updateKioskConfig, rotateKioskKey } = useTenants();
    
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [loading, setLoading] = useState(true);
    const [tenantStats, setTenantStats] = useState<TenantStats | null>(null);
    const [statsLoading, setStatsLoading] = useState(false);
    
    // Form states
    const [botForm, setBotForm] = useState({ phoneNumberId: '', accessToken: '', verifyToken: '' });
    const [payForm, setPayForm] = useState({ amount: '', note: '' });
    const [isBotConfigOpen, setIsBotConfigOpen] = useState(false);
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [isKioskConfigOpen, setIsKioskConfigOpen] = useState(false);
    const [showKioskKey, setShowKioskKey] = useState(false);
    const [kioskKey, setKioskKey] = useState('');
    const [allowedDomains, setAllowedDomains] = useState('');
    const [kioskActive, setKioskActive] = useState(false);

    // Plan States
    const [selectedPlanKey, setSelectedPlanKey] = useState('basic');
    const [expiryDate, setExpiryDate] = useState('');
    const [customLimits, setCustomLimits] = useState({ ...DEFAULT_CUSTOM_LIMITS });
    const [customFeatures, setCustomFeatures] = useState<any>({ ...DEFAULT_CUSTOM_FEATURES });
    const [showCustomConfig, setShowCustomConfig] = useState(false);
    const [isPlanConfigOpen, setIsPlanConfigOpen] = useState(false);
    const [savingPlan, setSavingPlan] = useState(false);

    useEffect(() => {
        if (id) loadTenant(id);
    }, [id]);

    const loadTenant = async (tenantId: string) => {
        const data = await getTenant(tenantId);
        if (data) {
            setTenant(data);
            setBotForm({
                phoneNumberId: data.whatsappConfig?.phoneNumberId || '',
                accessToken: data.whatsappConfig?.accessToken || '',
                verifyToken: data.whatsappConfig?.verifyToken || ''
            });
            setKioskKey(data.kioskConfig?.kioskKey || '');
            setKioskActive(data.kioskConfig?.isActive || false);
            setAllowedDomains(data.kioskConfig?.allowedDomains?.join(', ') || '');
            
            // Set Plan Data
            const planKey = String(data.plan || 'basic').toLowerCase();
            setSelectedPlanKey(planKey);
            setExpiryDate(new Date(String(data.expiryDate || Date.now())).toISOString().split('T')[0]);
            setShowCustomConfig(planKey === 'custom');
            if (planKey === 'custom') {
                setCustomLimits({ ...DEFAULT_CUSTOM_LIMITS, ...(data as any).limits });
                setCustomFeatures({ ...DEFAULT_CUSTOM_FEATURES, ...(data as any).features });
            }
        }
        setLoading(false);

        // Fetch per-tenant usage stats independently
        setStatsLoading(true);
        try {
            const { data: sData } = await api.get(API_ENDPOINTS.SUPER.TENANT_STATS(tenantId));
            setTenantStats(sData.data);
        } catch (e) {
            console.warn('Could not load tenant stats', e);
        } finally {
            setStatsLoading(false);
        }
    };

    const handleVerify = async () => {
        if (!tenant) return;
        const tid = tenant.id || tenant._id;
        if (!tid) return;
        const success = await verifyTenant(tid, 'verified');
        if (success) loadTenant(tid);
    };

    const handleDeactivate = async () => {
        if (!tenant) return;
        const tid = tenant.id || tenant._id;
        if (!tid) return;
        await toggleStatus(tid, tenant.isActive);
        loadTenant(tid);
    };

    const handleBotToggle = async () => {
        if (!tenant) return;
        const tid = tenant.id || tenant._id;
        if (!tid) return toast.error("Tenant ID missing");

        // Validation
        if (!botForm.phoneNumberId || !botForm.accessToken || !botForm.verifyToken) {
            return toast.error("Please fill all bot configuration fields");
        }

        const success = await assignBot(tid, botForm);
        if (success) loadTenant(tid);
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
        if (!tenant) return;
        const tid = tenant.id || tenant._id;
        if (!tid) return;

        setSavingPlan(true);
        try {
            const plan = PLANS.find(p => p.key === selectedPlanKey)!;
            const limits = selectedPlanKey === 'custom' ? customLimits : plan.limits;
            const features = selectedPlanKey === 'custom' ? customFeatures : plan.features;
            const payload = { 
                plan: selectedPlanKey.toUpperCase(), 
                limits, 
                features, 
                expiryDate: new Date(expiryDate).toISOString() 
            };
            const success = await updatePlan(tid, payload);
            if (success) {
                toast.success('Plan updated!');
                loadTenant(tid);
            }
        } catch {
            toast.error('Failed to update plan');
        } finally {
            setSavingPlan(false);
        }
    };

    const handleCreatePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tenant) return;
        const tid = tenant.id || tenant._id;
        if (!tid) return;
        try {
            await api.post(`/super/tenants/${tid}/payment-request`, payForm);
            toast.success("Payment request sent successfully!");
            setIsPayModalOpen(false);
            setPayForm({ amount: '', note: '' });
        } catch {
            toast.error("Failed to send payment request");
        }
    };

    const handleKioskUpdate = async () => {
        if (!tenant) return;
        const tid = tenant.id || tenant._id;
        if (!tid) return;

        const domains = allowedDomains.split(',').map(d => d.trim()).filter(d => d);
        const success = await updateKioskConfig(tid, {
            isActive: kioskActive,
            allowedDomains: domains,
            kioskKey: kioskKey // Preserve current key
        });
        if (success) loadTenant(tid);
    };

    const handleRotateKey = async () => {
        if (!tenant) return;
        const tid = tenant.id || tenant._id;
        if (!tid) return;

        const newKey = await rotateKioskKey(tid);
        if (newKey) {
            setKioskKey(newKey);
            loadTenant(tid);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard!');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0b14] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
            </div>
        );
    }

    if (!tenant) {
        return (
            <div className="min-h-screen bg-[#0a0b14] flex flex-col items-center justify-center p-4">
                <XCircle className="w-16 h-16 text-rose-500 mb-4" />
                <h1 className="text-2xl font-bold text-white">Showroom Not Found</h1>
                <Link to={ROUTES.SUPER_ADMIN.SHOWROOMS} className="mt-4 text-emerald-400 hover:underline">
                    Back to Showrooms
                </Link>
            </div>
        );
    }

    const currentPlan = PLANS.find(p => p.key.toLowerCase() === tenant.plan?.toLowerCase()) || PLANS[0];

    return (
        <div className="min-h-screen bg-[#0a0b14] text-slate-300 pb-20">
            {/* Header */}
            <div className="bg-[#11121d]/80 backdrop-blur-md sticky top-0 z-30 border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate(ROUTES.SUPER_ADMIN.SHOWROOMS)}
                            className="p-2 hover:bg-white/5 rounded-xl transition-colors group"
                        >
                            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-bold text-white">{tenant.name}</h1>
                                {tenant.verificationStatus === 'verified' ? (
                                    <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                                        <ShieldCheck className="w-3.5 h-3.5" />
                                        Verified
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium border border-amber-500/20">
                                        <ShieldAlert className="w-3.5 h-3.5" />
                                        Pending Review
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">{tenant._id}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10">
                            <span className="pl-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Verification:</span>
                            <select 
                                value={tenant.verificationStatus}
                                onChange={(e) => {
                                    const tid = tenant.id || tenant._id;
                                    if (tid) verifyTenant(tid, e.target.value as any).then(() => loadTenant(tid));
                                }}
                                className={`bg-transparent text-sm font-bold border-none focus:ring-0 cursor-pointer ${
                                    tenant.verificationStatus === 'verified' ? 'text-emerald-400' : 
                                    tenant.verificationStatus === 'rejected' ? 'text-rose-400' : 'text-amber-400'
                                }`}
                            >
                                <option value="pending" className="bg-[#161726]">Pending</option>
                                <option value="verified" className="bg-[#161726]">Verified</option>
                                <option value="rejected" className="bg-[#161726]">Rejected</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-3 bg-white/5 p-1.5 rounded-2xl border border-white/10">
                            <span className={`pl-4 text-sm font-bold ${tenant.isActive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {tenant.isActive ? 'Live' : 'Disabled'}
                            </span>
                            <button
                                onClick={handleDeactivate}
                                disabled={saving}
                                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                                    tenant.isActive 
                                    ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20' 
                                    : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20'
                                }`}
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
                                {tenant.isActive ? 'Suspend' : 'Activate'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">

                {/* ── Usage Stats Banner ─────────────────────────────── */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    {[
                        {
                            label: 'Total Stock',
                            value: statsLoading ? '…' : (tenantStats?.totalStock ?? '–'),
                            sub: statsLoading ? '' : `${tenantStats?.availableStock ?? 0} available`,
                            color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                        },
                        {
                            label: 'Available',
                            value: statsLoading ? '…' : (tenantStats?.availableStock ?? '–'),
                            sub: 'Ready to sell',
                            color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                        },
                        {
                            label: 'Sold',
                            value: statsLoading ? '…' : (tenantStats?.soldStock ?? '–'),
                            sub: 'Closed deals',
                            color: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
                        },
                        {
                            label: 'Total Leads',
                            value: statsLoading ? '…' : (tenantStats?.totalLeads ?? '–'),
                            sub: 'All time enquiries',
                            color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                        },
                        {
                            label: 'Leads This Month',
                            value: statsLoading ? '…' : (tenantStats?.leadsThisMonth ?? '–'),
                            sub: 'Current month',
                            color: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                        },
                    ].map((stat) => (
                        <div key={stat.label} className={`rounded-2xl p-5 border ${stat.color} relative overflow-hidden`}>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">{stat.label}</p>
                            <p className="text-3xl font-black">{stat.value}</p>
                            <p className="text-[10px] font-bold mt-1 opacity-50 uppercase tracking-widest">{stat.sub}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column - Core Info */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* Info Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-[#161726] rounded-2xl p-6 border border-white/5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                                    <Mail className="w-20 h-20" />
                                </div>
                                <h3 className="text-sm font-medium text-slate-500 mb-4 uppercase tracking-wider">Contact Information</h3>
                                <div className="space-y-4 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Email Address</p>
                                            <p className="text-sm font-medium text-white">{(tenant as any).email || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                                            <Shield className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Showroom Admin</p>
                                            <p className="text-sm font-medium text-white">{(tenant as any).ownerName || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                            <Phone className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Phone Number</p>
                                            <p className="text-sm font-medium text-white">{tenant.phone || 'Not provided'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#161726] rounded-2xl p-6 border border-white/5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                                    <Activity className="w-20 h-20" />
                                </div>
                                <h3 className="text-sm font-medium text-slate-500 mb-4 uppercase tracking-wider">System Status</h3>
                                <div className="space-y-4 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tenant.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                            <Power className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Account Status</p>
                                            <p className={`text-sm font-medium ${tenant.isActive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {tenant.isActive ? 'Active & Live' : 'Deactivated'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Member Since</p>
                                            <p className="text-sm font-medium text-white">{new Date(tenant.createdAt || Date.now()).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Plan Configuration */}
                        <div className="bg-[#161726] rounded-2xl border border-white/5 overflow-hidden">
                            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                        <CreditCard className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Plan Configuration</h3>
                                        <p className="text-xs text-slate-500">Manage subscription and features</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsPlanConfigOpen(!isPlanConfigOpen)}
                                    className="p-2 hover:bg-white/5 rounded-lg text-slate-400"
                                >
                                    <Settings className={`w-5 h-5 transition-transform ${isPlanConfigOpen ? 'rotate-90' : ''}`} />
                                </button>
                            </div>
                            
                            <div className={`transition-all duration-300 ${isPlanConfigOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                                <div className="p-6 space-y-8">
                                    {/* Plan Selector Grid */}
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                        {PLANS.map(plan => (
                                            <button
                                                key={plan.key}
                                                onClick={() => handlePlanSelect(plan.key)}
                                                className={`relative p-5 rounded-2xl border-2 text-left transition-all duration-300 group ${
                                                    selectedPlanKey === plan.key 
                                                        ? 'border-indigo-600 bg-indigo-500/10 shadow-[0_10px_40px_rgba(79,70,229,0.15)] scale-[1.02]' 
                                                        : 'border-white/5 bg-[#0a0b14] hover:border-white/10 hover:bg-white/5'
                                                }`}
                                            >
                                                {selectedPlanKey === plan.key && (
                                                    <div className="absolute top-4 right-4 text-white bg-indigo-600 p-1 rounded-full shadow-md">
                                                        <Check size={10} strokeWidth={4} />
                                                    </div>
                                                )}
                                                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform origin-left">{plan.emoji}</div>
                                                <div className="text-sm font-black text-white">{plan.label}</div>
                                                <div className="text-[10px] font-black mt-1 text-slate-400 uppercase tracking-widest">
                                                    {plan.price}
                                                </div>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Custom Config Section */}
                                    {showCustomConfig && (
                                        <div className="p-6 bg-[#0a0b14] rounded-2xl border border-white/5 animate-in fade-in slide-in-from-top-4 duration-500">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
                                                    <Settings size={16} />
                                                </div>
                                                <h4 className="text-sm font-black text-white uppercase tracking-wider">Custom Plan Governance</h4>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Showroom Capacity</label>
                                                    <div className="flex items-center gap-4 bg-[#161726] p-4 rounded-xl border border-white/5">
                                                        <input 
                                                            type="number" 
                                                            value={customLimits.maxCars}
                                                            onChange={e => setCustomLimits({ maxCars: parseInt(e.target.value) || 0 })}
                                                            className="flex-1 bg-transparent border-none text-xl font-black text-white focus:ring-0"
                                                        />
                                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">VEHICLES</span>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Feature Access</label>
                                                    <div className="space-y-3">
                                                        {[
                                                            { key: 'whatsappBot', label: 'WhatsApp AI Bot', icon: Bot, color: 'text-emerald-400' },
                                                            { key: 'campaigns', label: 'Marketing Campaigns', icon: Megaphone, color: 'text-indigo-400' },
                                                            { key: 'qrCode', label: 'QR Code Generation', icon: Shield, color: 'text-amber-400' }
                                                        ].map(({ key, label, icon: Icon, color }) => (
                                                            <div key={key} className="flex items-center justify-between p-3 bg-[#161726] rounded-xl border border-white/5">
                                                                <div className="flex items-center gap-3">
                                                                    <Icon size={16} className={color} />
                                                                    <span className="text-sm font-bold text-white">{label}</span>
                                                                </div>
                                                                <Toggle 
                                                                    value={customFeatures[key]}
                                                                    onChange={v => setCustomFeatures((prev: any) => ({ ...prev, [key]: v }))}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Expiry & Actions */}
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-indigo-600/5 rounded-2xl border border-indigo-500/10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                                <Calendar size={24} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Renewal Date</p>
                                                <input 
                                                    type="date" 
                                                    value={expiryDate}
                                                    onChange={e => setExpiryDate(e.target.value)}
                                                    className="bg-transparent border-none text-white font-bold focus:ring-0 p-0 text-lg cursor-pointer"
                                                    style={{ colorScheme: 'dark' }}
                                                />
                                            </div>
                                        </div>
                                        
                                        <button 
                                            onClick={handleUpdatePlan}
                                            disabled={savingPlan}
                                            className="w-full md:w-auto px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-500/20 active:scale-95 disabled:opacity-50"
                                        >
                                            {savingPlan ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                            Commit Plan Changes
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bot Configuration */}
                        <div className="bg-[#161726] rounded-2xl border border-white/5 overflow-hidden">
                            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                        <Bot className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">WhatsApp Bot</h3>
                                        <p className="text-xs text-slate-500">Configure Meta API credentials</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsBotConfigOpen(!isBotConfigOpen)}
                                    className="p-2 hover:bg-white/5 rounded-lg text-slate-400"
                                >
                                    <Settings className={`w-5 h-5 transition-transform ${isBotConfigOpen ? 'rotate-90' : ''}`} />
                                </button>
                            </div>
                            
                            <div className={`transition-all duration-300 ${isBotConfigOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                                <div className="p-6 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone Number ID</label>
                                            <input 
                                                type="text"
                                                value={botForm.phoneNumberId}
                                                onChange={(e) => setBotForm({...botForm, phoneNumberId: e.target.value})}
                                                className="w-full bg-[#0a0b14] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                                                placeholder="e.g. 106345678901234"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Verify Token</label>
                                            <input 
                                                type="text"
                                                value={botForm.verifyToken}
                                                onChange={(e) => setBotForm({...botForm, verifyToken: e.target.value})}
                                                className="w-full bg-[#0a0b14] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                                                placeholder="Your secret verify token"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Permanent Access Token</label>
                                        <textarea 
                                            value={botForm.accessToken}
                                            onChange={(e) => setBotForm({...botForm, accessToken: e.target.value})}
                                            className="w-full bg-[#0a0b14] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors min-h-[100px]"
                                            placeholder="EAAl..."
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <button 
                                            onClick={handleBotToggle}
                                            disabled={saving}
                                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                                        >
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                                            Update Bot Config
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {!isBotConfigOpen && (
                                <div className="p-6 bg-emerald-500/5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${tenant.whatsappConfig?.botEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                                        <span className="text-sm font-medium">
                                            Bot is {tenant.whatsappConfig?.botEnabled ? 'Active' : 'Disabled'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={async () => {
                                                if (!tenant) return;
                                                const tid = tenant.id || tenant._id;
                                                if (tid) await api.patch(`/super/tenants/${tid}/bot-toggle`, { botEnabled: !tenant.whatsappConfig?.botEnabled }).then(() => loadTenant(tid));
                                            }}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${tenant.whatsappConfig?.botEnabled ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'}`}
                                        >
                                            {tenant.whatsappConfig?.botEnabled ? 'Suspend Bot' : 'Enable Bot'}
                                        </button>
                                        <p className="text-xs text-slate-500 font-mono">
                                            {tenant.whatsappConfig?.phoneNumberId || 'No ID assigned'}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Kiosk Configuration */}
                        <div className="bg-[#161726] rounded-2xl border border-white/5 overflow-hidden">
                            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                        <Monitor className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Kiosk Configuration</h3>
                                        <p className="text-xs text-slate-500">Enable and manage external kiosk access</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsKioskConfigOpen(!isKioskConfigOpen)}
                                    className="p-2 hover:bg-white/5 rounded-lg text-slate-400"
                                >
                                    <Settings className={`w-5 h-5 transition-transform ${isKioskConfigOpen ? 'rotate-90' : ''}`} />
                                </button>
                            </div>
                            
                            <div className={`transition-all duration-300 ${isKioskConfigOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                                <div className="p-6 space-y-6">
                                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl ${kioskActive ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
                                                <Monitor size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">Enable Kiosk Platform</p>
                                                <p className="text-[10px] text-slate-500 font-medium">Allow authorized websites to access inventory</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setKioskActive(!kioskActive)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${kioskActive ? 'bg-indigo-600' : 'bg-slate-700'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${kioskActive ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kiosk Authorization Key</label>
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <input 
                                                        type={showKioskKey ? 'text' : 'password'}
                                                        value={kioskKey || 'Not generated'}
                                                        readOnly
                                                        className="w-full bg-[#0a0b14] border border-white/10 rounded-xl px-4 py-3 text-sm font-mono font-bold text-slate-400"
                                                    />
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                                        <button onClick={() => setShowKioskKey(!showKioskKey)} className="text-slate-500 hover:text-indigo-400 transition-colors">
                                                            {showKioskKey ? <EyeOff size={14} /> : <Eye size={14} />}
                                                        </button>
                                                        {kioskKey && (
                                                            <button onClick={() => copyToClipboard(kioskKey)} className="text-slate-500 hover:text-indigo-400 transition-colors">
                                                                <Copy size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={handleRotateKey}
                                                    disabled={saving}
                                                    className="px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-white/10"
                                                >
                                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw size={14} />}
                                                    Rotate
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest px-1">⚠️ Resetting key will disconnect existing kiosks.</p>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Allowed Domains (CORS)</label>
                                            <input 
                                                type="text"
                                                value={allowedDomains}
                                                onChange={(e) => setAllowedDomains(e.target.value)}
                                                className="w-full bg-[#0a0b14] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
                                                placeholder="https://mykiosk.com, https://portal.net"
                                            />
                                            <p className="text-[10px] text-slate-500 font-medium px-1">Comma-separated list of domains allowed to access the API.</p>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <button 
                                            onClick={handleKioskUpdate}
                                            disabled={saving}
                                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                                        >
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            Save Kiosk Config
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {!isKioskConfigOpen && (
                                <div className="p-6 bg-indigo-500/5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${tenant.kioskConfig?.isActive ? 'bg-indigo-500 animate-pulse' : 'bg-slate-600'}`} />
                                        <span className="text-sm font-medium">
                                            Kiosk Platform is {tenant.kioskConfig?.isActive ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-mono italic">
                                        {tenant.kioskConfig?.allowedDomains?.length || 0} domain(s) whitelisted
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Subscription & Actions */}
                    <div className="space-y-8">
                        
                        {/* Plan Card */}
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 shadow-2xl shadow-indigo-500/20 relative overflow-hidden">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                            
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-white">
                                        <Package className="w-6 h-6" />
                                    </div>
                                    <select 
                                        value={tenant.plan || 'basic'}
                                        onChange={(e) => {
                                            const tid = tenant.id || tenant._id;
                                            if (tid) updatePlan(tid, { plan: e.target.value as any }).then(() => loadTenant(tid));
                                        }}
                                        className="bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest border border-white/20 rounded-full px-3 py-1 focus:ring-0 cursor-pointer"
                                    >
                                        <option value="trial" className="text-slate-900">Trial</option>
                                        <option value="basic" className="text-slate-900">Basic</option>
                                        <option value="pro" className="text-slate-900">Pro</option>
                                        <option value="enterprise" className="text-slate-900">Enterprise</option>
                                        <option value="custom" className="text-slate-900">Custom</option>
                                    </select>
                                </div>
                                
                                <h2 className="text-3xl font-black text-white flex items-center gap-3">
                                    {currentPlan.emoji} {currentPlan.label}
                                </h2>
                                <p className="text-white/70 text-sm mt-2 font-medium">
                                    {currentPlan.price} / Month
                                </p>

                                <div className="mt-8 pt-8 border-t border-white/10 space-y-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-white/60">Expiry Date</span>
                                        <input 
                                            type="date"
                                            value={tenant.expiryDate ? new Date(tenant.expiryDate).toISOString().split('T')[0] : ''}
                                            onChange={(e) => {
                                                const tid = tenant.id || tenant._id;
                                                if (tid) updatePlan(tid, { expiryDate: new Date(e.target.value).toISOString() }).then(() => loadTenant(tid));
                                            }}
                                            className="bg-transparent text-white font-bold border-none p-0 text-right focus:ring-0 cursor-pointer"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-white/60">Vehicle Limit</span>
                                        <span className="text-white font-bold">{tenant.limits?.maxCars || 50} Cars</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Leads */}
                        <div className="bg-[#161726] rounded-2xl p-6 border border-white/5">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recent Leads</h3>
                                <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">
                                    {tenantStats?.totalLeads ?? 0} total
                                </span>
                            </div>

                            {statsLoading ? (
                                <div className="space-y-3">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />
                                    ))}
                                </div>
                            ) : tenantStats?.recentLeads && tenantStats.recentLeads.length > 0 ? (
                                <div className="space-y-3">
                                    {tenantStats.recentLeads.map((lead) => (
                                        <div key={lead._id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0 ${
                                                lead.priority === 'Hot' ? 'bg-rose-500/20 text-rose-400' :
                                                lead.priority === 'Warm' ? 'bg-amber-500/20 text-amber-400' :
                                                'bg-slate-500/20 text-slate-400'
                                            }`}>
                                                {lead.name?.substring(0, 2).toUpperCase() || '??'}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-bold text-white truncate">{lead.name}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{lead.stage}</span>
                                                    <span className="text-[9px] text-slate-600">·</span>
                                                    <span className="text-[9px] font-bold text-slate-500">
                                                        {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full flex-shrink-0 ${
                                                lead.priority === 'Hot' ? 'bg-rose-500/20 text-rose-400' :
                                                lead.priority === 'Warm' ? 'bg-amber-500/20 text-amber-400' :
                                                'bg-slate-500/20 text-slate-400'
                                            }`}>
                                                {lead.priority}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-8 text-center">
                                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">No leads yet for this showroom</p>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="bg-[#161726] rounded-2xl p-6 border border-white/5 space-y-3">
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Quick Actions</h3>
                            
                            <button 
                                onClick={() => setIsPayModalOpen(true)}
                                className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 flex items-center justify-between transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                                        <CreditCard className="w-5 h-5" />
                                    </div>
                                    <span className="text-sm font-bold text-white">Create Payment</span>
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </button>

                            <a 
                                href={`mailto:${(tenant as any).email}`}
                                className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 flex items-center justify-between transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <span className="text-sm font-bold text-white">Email Partner</span>
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </a>
                        </div>
                    </div>
                </div>
            </main>

            {/* Payment Modal */}
            {isPayModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#0a0b14]/90 backdrop-blur-sm" onClick={() => setIsPayModalOpen(false)} />
                    <div className="bg-[#161726] w-full max-w-md rounded-3xl border border-white/10 shadow-2xl relative z-10 overflow-hidden">
                        <div className="p-8 border-b border-white/5">
                            <h2 className="text-2xl font-black text-white">Create Payment</h2>
                            <p className="text-sm text-slate-500 mt-1">Send a new invoice to {tenant.name}</p>
                        </div>
                        <form onSubmit={handleCreatePayment} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount (₹)</label>
                                <input 
                                    type="number"
                                    required
                                    value={payForm.amount}
                                    onChange={(e) => setPayForm({...payForm, amount: e.target.value})}
                                    className="w-full bg-[#0a0b14] border border-white/10 rounded-xl px-4 py-3 text-lg font-bold text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment Note / Reason</label>
                                <textarea 
                                    required
                                    value={payForm.note}
                                    onChange={(e) => setPayForm({...payForm, note: e.target.value})}
                                    className="w-full bg-[#0a0b14] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500/50 transition-colors min-h-[100px]"
                                    placeholder="e.g. Monthly subscription for Pro plan"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => setIsPayModalOpen(false)}
                                    className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-amber-600/20"
                                >
                                    Send Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShowroomDetail;
