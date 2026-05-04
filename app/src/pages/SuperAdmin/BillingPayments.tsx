import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '../../lib/utils';
import {
    CreditCard, Loader2, CheckCircle2, XCircle, Clock, Send,
    ExternalLink, Eye, X, BadgeCheck, RefreshCw, Building2,
    Calendar, IndianRupee, FileImage, ChevronDown, Upload,
    Download, Plus
} from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

// ─── Types ─────────────────────────────────────────────────────────────────
interface PaymentRequest {
    _id: string;
    amount: number;
    note?: string;
    status: 'pending' | 'paid' | 'verified' | 'rejected';
    screenshotUrl?: string;
    createdAt: string;
    paidAt?: string;
    showroomId: string;
    showroomName: string;
    showroomPlan: string;
    showroomExpiry: string;
    rejectReason?: string;
}

interface Tenant {
    _id: string;
    id?: string;
    name: string;
    plan: string;
    expiryDate: string;
    limits?: { maxCars: number };
    features?: { whatsappBot: boolean; campaigns: boolean; qrCode: boolean };
}

// ─── Status Badge ──────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
        pending: { color: 'bg-amber-100 text-amber-700', icon: <Clock size={11} />, label: 'Pending' },
        paid: { color: 'bg-indigo-100 text-indigo-700', icon: <Upload size={11} />, label: 'Proof Uploaded' },
        verified: { color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 size={11} />, label: 'Verified' },
        rejected: { color: 'bg-rose-100 text-rose-600', icon: <XCircle size={11} />, label: 'Rejected' },
    };
    const s = map[status] || map.pending;
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${s.color}`}>
            {s.icon} {s.label}
        </span>
    );
};

const planBadge: Record<string, string> = {
    trial: 'bg-slate-100 text-slate-600',
    basic: 'bg-blue-100 text-blue-700',
    pro: 'bg-indigo-100 text-indigo-700',
    enterprise: 'bg-amber-100 text-amber-700',
    custom: 'bg-rose-100 text-rose-700',
};

// ─── Main Component ────────────────────────────────────────────────────────
const BillingPayments = () => {
    const [requests, setRequests] = useState<PaymentRequest[]>([]);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [showroomFilter, setShowroomFilter] = useState<string>('all');
    const [proofModal, setProofModal] = useState<PaymentRequest | null>(null);
    const [sendModal, setSendModal] = useState<Tenant | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [expandedImage, setExpandedImage] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);

    const [verifyState, setVerifyState] = useState<'idle' | 'rejecting' | 'confirming'>('idle');
    const [verifyForm, setVerifyForm] = useState({ rejectReason: '', newExpiryDate: '' });

    // Send payment request form
    const [sendForm, setSendForm] = useState({ amount: '', note: '', expiryDate: '' });

    const fetchData = useCallback(async () => {
        try {
            const [reqRes, tenantRes] = await Promise.all([
                api.get('/super/payment-requests'),
                api.get('/super/tenants'),
            ]);
            setRequests(reqRes.data.data || []);
            setTenants(tenantRes.data.data || []);
        } catch {
            toast.error('Failed to load billing data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        if (sendModal) {
            const features = [];
            if (sendModal.features?.whatsappBot) features.push('WhatsApp Bot');
            if (sendModal.features?.campaigns) features.push('Campaigns');
            if (sendModal.features?.qrCode) features.push('QR Codes');
            
            const featureList = features.length > 0 ? ` + Features: ${features.join(', ')}` : '';
            const carLimit = sendModal.limits?.maxCars ? ` (Limit: ${sendModal.limits.maxCars} cars)` : '';
            
            setSendForm(prev => ({
                ...prev,
                note: `${sendModal.plan.toUpperCase()} Plan Renewal${carLimit}${featureList}.`
            }));
        }
    }, [sendModal]);

    const handleUpdateStatus = async (req: PaymentRequest, newStatus: 'paid' | 'verified' | 'rejected') => {
        setActionLoading(req._id);
        try {
            const payload: any = { status: newStatus };
            if (newStatus === 'verified' && verifyForm.newExpiryDate) payload.newExpiryDate = verifyForm.newExpiryDate;
            if (newStatus === 'rejected' && verifyForm.rejectReason) payload.rejectReason = verifyForm.rejectReason;

            await api.patch(`/super/tenants/${req.showroomId}/payment-request/${req._id}`, payload);
            setRequests(prev => prev.map(r => r._id === req._id ? { ...r, status: newStatus, rejectReason: payload.rejectReason } : r));
            toast.success(`Marked as ${newStatus}`);
            setProofModal(null);
            setVerifyState('idle');
        } catch {
            toast.error('Failed to update status');
        } finally {
            setActionLoading(null);
        }
    };

    const downloadImage = async (url: string, filename: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error('Download failed', err);
            // Fallback to direct link if fetch fails (CORS)
            window.open(url, '_blank');
        }
    };

    const handleSendRequest = async () => {
        if (!sendModal || !sendForm.amount) return;
        setActionLoading('send');
        try {
            const payload: any = { amount: Number(sendForm.amount), note: sendForm.note };
            if (sendForm.expiryDate) payload.expiryDate = new Date(sendForm.expiryDate).toISOString();
            await api.post(`/super/tenants/${sendModal._id || sendModal.id}/payment-request`, payload);
            toast.success(`Payment request sent to ${sendModal.name}`);
            setSendModal(null);
            setSendForm({ amount: '', note: '', expiryDate: '' });
            fetchData();
        } catch {
            toast.error('Failed to send payment request');
        } finally {
            setActionLoading(null);
        }
    };

    const filtered = requests.filter(r => {
        const matchStatus = statusFilter === 'all' || r.status === statusFilter;
        const matchShowroom = showroomFilter === 'all' || r.showroomId === showroomFilter;
        return matchStatus && matchShowroom;
    });

    // Stats
    const totalPending = requests.filter(r => r.status === 'pending').length;
    const totalPaid = requests.filter(r => r.status === 'paid').reduce((s, r) => s + r.amount, 0);
    const totalRequests = requests.length;

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
    );

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Billing & Payments</h1>
                    <p className="text-slate-500 font-medium mt-1">Track all payment proofs, send invoices, and update plan expiry.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={fetchData} className="p-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-colors">
                        <RefreshCw size={18} />
                    </button>
                    <button
                        onClick={() => { setSendModal(tenants[0] || null); setSendForm({ amount: '', note: '', expiryDate: '' }); }}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg text-sm"
                    >
                        <Send size={16} /> New Payment Request
                    </button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Pending Confirmations', value: totalPending, color: 'bg-amber-50 border-amber-100', textColor: 'text-amber-700', icon: <Clock size={20} className="text-amber-500" /> },
                    { label: 'Total Collected', value: `₹${totalPaid.toLocaleString()}`, color: 'bg-emerald-50 border-emerald-100', textColor: 'text-emerald-700', icon: <IndianRupee size={20} className="text-emerald-500" /> },
                    { label: 'All Requests', value: totalRequests, color: 'bg-indigo-50 border-indigo-100', textColor: 'text-indigo-700', icon: <CreditCard size={20} className="text-indigo-500" /> },
                ].map(s => (
                    <div key={s.label} className={`rounded-[1.5rem] border p-6 flex items-center gap-4 ${s.color}`}>
                        <div className="p-3 bg-white rounded-2xl shadow-sm">{s.icon}</div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                            <p className={`text-2xl font-black ${s.textColor}`}>{s.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter Tabs */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-slate-50 bg-slate-50/40">
                    <div className="flex items-center gap-2">
                        {['all', 'pending', 'paid', 'verified', 'rejected'].map(f => (
                            <button
                                key={f}
                                onClick={() => setStatusFilter(f)}
                                className={`px-5 py-2 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${
                                    statusFilter === f
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'text-slate-500 hover:bg-slate-100'
                                }`}
                            >
                                {f.toUpperCase()} ({f === 'all' ? requests.length : requests.filter(r => r.status === f).length})
                            </button>
                        ))}
                    </div>
                    <select
                        value={showroomFilter}
                        onChange={e => setShowroomFilter(e.target.value)}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 text-xs outline-none focus:ring-2 focus:ring-indigo-100"
                    >
                        <option value="all">All Showrooms</option>
                        {tenants.map(t => (
                            <option key={t._id || t.id} value={t._id || t.id}>{t.name}</option>
                        ))}
                    </select>
                </div>

                {/* Payment Requests Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-50">
                                {['Showroom', 'Amount', 'Plan', 'Status', 'Date', 'Proof', 'Actions'].map(h => (
                                    <th key={h} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-20 text-center">
                                        <CreditCard size={32} className="mx-auto mb-3 text-slate-300" />
                                        <p className="text-sm font-bold text-slate-400">No payment requests found</p>
                                    </td>
                                </tr>
                            ) : filtered.map(req => (
                                <tr key={req._id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                                <Building2 size={16} className="text-indigo-500" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">{req.showroomName}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">
                                                    Expires: {req.showroomExpiry ? new Date(req.showroomExpiry).toLocaleDateString() : '—'}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-base font-black text-slate-900">₹{req.amount.toLocaleString()}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg ${planBadge[req.showroomPlan?.toLowerCase()] || 'bg-slate-100 text-slate-600'}`}>
                                            {req.showroomPlan || '—'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={req.status} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="text-xs font-bold text-slate-700">{new Date(req.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                            {req.paidAt && <p className="text-[10px] text-emerald-600 font-bold mt-0.5">Paid: {new Date(req.paidAt).toLocaleDateString()}</p>}
                                            {req.note && <p className="text-[10px] text-slate-400 mt-0.5 max-w-[160px] truncate">{req.note}</p>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {req.screenshotUrl ? (
                                            <button
                                                onClick={() => { setProofModal(req); setVerifyState('idle'); setVerifyForm({ rejectReason: '', newExpiryDate: req.showroomExpiry ? new Date(req.showroomExpiry).toISOString().split('T')[0] : '' }); }}
                                                className="flex items-center gap-1.5 text-[11px] font-black text-indigo-600 hover:text-indigo-700 px-3 py-1.5 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors"
                                            >
                                                <Eye size={12} /> View
                                            </button>
                                        ) : (
                                            <span className="text-[10px] text-slate-400 font-bold">No proof</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {['pending', 'paid'].includes(req.status) ? (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => { setProofModal(req); setVerifyState('confirming'); setVerifyForm({ rejectReason: '', newExpiryDate: req.showroomExpiry ? new Date(req.showroomExpiry).toISOString().split('T')[0] : '' }); }}
                                                    className="px-3 py-1.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-emerald-100 transition-colors shadow-sm"
                                                >
                                                    Verify
                                                </button>
                                                <button
                                                    onClick={() => { setProofModal(req); setVerifyState('rejecting'); setVerifyForm({ rejectReason: '', newExpiryDate: '' }); }}
                                                    className="px-3 py-1.5 bg-rose-50 text-rose-600 font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-rose-100 transition-colors shadow-sm"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => { setProofModal(req); setVerifyState('idle'); }}
                                                className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition-colors flex items-center gap-1"
                                            >
                                                Details <ChevronDown size={12} className="-rotate-90"/>
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Proof Viewer Modal ── */}
            {proofModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden">
                        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-black text-white">Payment Proof</h2>
                                <p className="text-sm text-indigo-300 font-bold mt-0.5">{proofModal.showroomName} — ₹{proofModal.amount.toLocaleString()}</p>
                            </div>
                            <button onClick={() => setProofModal(null)} className="p-2 bg-white/10 rounded-xl text-white/70 hover:bg-white/20">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div 
                                onClick={() => proofModal.screenshotUrl?.startsWith('http') && setExpandedImage(proofModal.screenshotUrl)}
                                className={cn(
                                    "rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50 flex items-center justify-center min-h-[200px] cursor-zoom-in group relative",
                                    proofModal.screenshotUrl?.startsWith('http') && "hover:border-indigo-200 transition-colors"
                                )}
                            >
                                {proofModal.screenshotUrl?.startsWith('http') ? (
                                    <>
                                        <img
                                            src={proofModal.screenshotUrl}
                                            alt="Payment proof"
                                            className="w-full object-contain max-h-80"
                                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                        />
                                        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 flex items-center justify-center transition-all">
                                            <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-xl opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-900">
                                                <Eye size={16} /> Click to Expand
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-slate-400 text-sm font-medium p-8 text-center">{proofModal.screenshotUrl}</p>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                {proofModal.note && (
                                    <div className="col-span-2 bg-slate-50 rounded-xl p-3 border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Note</p>
                                        <p className="font-bold text-slate-700">{proofModal.note}</p>
                                    </div>
                                )}
                                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Submitted</p>
                                    <p className="font-bold text-slate-700">{new Date(proofModal.createdAt).toLocaleString()}</p>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                    <StatusBadge status={proofModal.status} />
                                </div>
                            </div>
                            {proofModal.screenshotUrl?.startsWith('http') && (
                                <div className="space-y-3">
                                    <button 
                                        onClick={() => setExpandedImage(proofModal.screenshotUrl!)}
                                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl"
                                    >
                                        <Eye size={16} /> View Full Screen
                                    </button>
                                    <button 
                                        onClick={() => downloadImage(proofModal.screenshotUrl!, `payment-proof-${proofModal.showroomName.toLowerCase().replace(/\s+/g, '-')}.png`)}
                                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-50 text-indigo-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-100 transition-all active:scale-95 border border-indigo-100"
                                    >
                                        <Download size={16} /> Download Proof
                                    </button>
                                </div>
                            )}
                            
                            {/* Rejection Message Display */}
                            {proofModal.status === 'rejected' && proofModal.rejectReason && (
                                <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
                                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Rejection Reason</p>
                                    <p className="text-sm font-bold text-rose-700">{proofModal.rejectReason}</p>
                                </div>
                            )}

                            {verifyState === 'idle' && (
                                <div className="flex gap-3 mt-4 border-t border-slate-50 pt-4">
                                    <button
                                        onClick={() => setVerifyState('rejecting')}
                                        className="flex-1 py-3 bg-rose-50 text-rose-600 rounded-2xl font-bold text-sm hover:bg-rose-100 transition-colors"
                                    >
                                        {proofModal.status === 'rejected' ? 'Update Rejection Note' : 'Reject Proof'}
                                    </button>
                                    <button
                                        onClick={() => setVerifyState('confirming')}
                                        className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl font-bold text-sm hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100"
                                    >
                                        {proofModal.status === 'verified' ? 'Extend Plan Expiry' : '✓ Verify Proof'}
                                    </button>
                                </div>
                            )}

                            {verifyState === 'rejecting' && (
                                <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 space-y-4 mt-4">
                                    <div>
                                        <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest block mb-2">Rejection Reason</label>
                                        <textarea
                                            rows={2}
                                            value={verifyForm.rejectReason}
                                            onChange={e => setVerifyForm(p => ({...p, rejectReason: e.target.value}))}
                                            className="w-full px-4 py-3 bg-white border border-rose-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-rose-200 outline-none resize-none placeholder:text-slate-300"
                                            placeholder="E.g. Uploaded screenshot is blurry, please re-upload."
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={() => setVerifyState('idle')} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-xl text-sm">Cancel</button>
                                        <button 
                                            onClick={() => handleUpdateStatus(proofModal, 'rejected')}
                                            disabled={actionLoading === proofModal._id || !verifyForm.rejectReason}
                                            className="flex-1 bg-rose-600 text-white font-bold rounded-xl py-2 flex items-center justify-center gap-2 hover:bg-rose-700 disabled:opacity-50"
                                        >
                                            {actionLoading === proofModal._id ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />} Confirm Rejection
                                        </button>
                                    </div>
                                </div>
                            )}

                            {verifyState === 'confirming' && (
                                <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 space-y-4 mt-4">
                                    <div>
                                        <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-2 flex items-center gap-1">
                                            <Calendar size={12} /> Set New Plan Expiry Date
                                        </label>
                                        <input
                                            type="date"
                                            value={verifyForm.newExpiryDate}
                                            onChange={e => setVerifyForm(p => ({...p, newExpiryDate: e.target.value}))}
                                            className="w-full px-4 py-3 bg-white border border-emerald-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-200 outline-none text-slate-700"
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={() => setVerifyState('idle')} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-xl text-sm">Cancel</button>
                                        <button 
                                            onClick={() => handleUpdateStatus(proofModal, 'verified')}
                                            disabled={actionLoading === proofModal._id || !verifyForm.newExpiryDate}
                                            className="flex-1 bg-emerald-600 text-white font-bold rounded-xl py-2 flex items-center justify-center gap-2 hover:bg-emerald-700 disabled:opacity-50"
                                        >
                                            {actionLoading === proofModal._id ? <Loader2 size={16} className="animate-spin" /> : <BadgeCheck size={16} />} Confirm Payment & Extend Plan
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Send Payment Request Modal ── */}
            {sendModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-6 flex items-center justify-between">
                            <h2 className="text-lg font-black text-white">New Payment Request</h2>
                            <button onClick={() => setSendModal(null)} className="p-2 bg-white/10 rounded-xl text-white/70 hover:bg-white/20"><X size={18} /></button>
                        </div>
                        <div className="p-6 space-y-5">
                            {/* Showroom Picker */}
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Showroom</label>
                                <div className="relative">
                                    <select
                                        value={sendModal._id || sendModal.id}
                                        onChange={e => setSendModal(tenants.find(t => (t._id || t.id) === e.target.value) || null)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 text-sm appearance-none pr-10"
                                    >
                                        {tenants.map(t => (
                                            <option key={t._id || t.id} value={t._id || t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Amount (₹)</label>
                                <input
                                    type="number"
                                    value={sendForm.amount}
                                    onChange={e => setSendForm(p => ({ ...p, amount: e.target.value }))}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xl"
                                    placeholder="999"
                                />
                            </div>

                            {/* Expiry Date — NEW */}
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-1">
                                    <Calendar size={10} /> New Plan Expiry Date <span className="text-slate-300">(optional)</span>
                                </label>
                                <input
                                    type="date"
                                    value={sendForm.expiryDate}
                                    onChange={e => setSendForm(p => ({ ...p, expiryDate: e.target.value }))}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 text-sm"
                                />
                                <p className="text-[10px] text-slate-400 font-medium mt-1.5">
                                    If set, the showroom's plan will be extended to this date when the request is sent.
                                </p>
                            </div>

                            {/* Note */}
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Invoice Note</label>
                                <textarea
                                    rows={2}
                                    value={sendForm.note}
                                    onChange={e => setSendForm(p => ({ ...p, note: e.target.value }))}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-medium text-sm resize-none"
                                    placeholder="Monthly Pro plan renewal — April 2026..."
                                />
                            </div>

                            <div className="flex gap-3 justify-end">
                                <button onClick={() => setSendModal(null)} className="px-5 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl">Cancel</button>
                                <button
                                    onClick={handleSendRequest}
                                    disabled={actionLoading === 'send' || !sendForm.amount}
                                    className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-100"
                                >
                                    {actionLoading === 'send' ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                    Send Request
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* ── Full Screen Image Viewer ── */}
            {expandedImage && (
                <div 
                    className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 bg-slate-950/98 backdrop-blur-xl animate-in fade-in duration-300"
                    onClick={() => { setExpandedImage(null); setZoom(1); }}
                >
                    <div className="absolute top-8 left-8 right-8 flex items-center justify-between z-10">
                        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
                             <div className="flex items-center gap-3 pr-4 border-r border-white/10">
                                <FileImage className="text-indigo-400" size={20} />
                                <span className="text-white font-black text-xs uppercase tracking-widest">Image Inspector</span>
                             </div>
                             <div className="flex items-center gap-2 pl-2">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setZoom(z => Math.max(0.5, z - 0.25)); }}
                                    className="p-2 hover:bg-white/10 rounded-lg text-white/70 transition-colors"
                                >
                                    <XCircle size={16} className="rotate-45" /> {/* - */}
                                </button>
                                <span className="text-white/60 text-[10px] font-black w-12 text-center">{Math.round(zoom * 100)}%</span>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setZoom(z => Math.min(3, z + 0.25)); }}
                                    className="p-2 hover:bg-white/10 rounded-lg text-white/70 transition-colors"
                                >
                                    <Plus size={16} />
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setZoom(1); }}
                                    className="ml-2 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-md text-[9px] font-black text-white/70 uppercase tracking-widest transition-all"
                                >
                                    Reset
                                </button>
                             </div>
                        </div>
                        
                        <button 
                            onClick={() => { setExpandedImage(null); setZoom(1); }}
                            className="p-4 bg-rose-500/20 hover:bg-rose-500/40 rounded-full text-rose-200 transition-all shadow-2xl border border-rose-500/30"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="w-full h-full flex items-center justify-center overflow-auto custom-scrollbar p-12">
                        <img 
                            src={expandedImage} 
                            alt="Full proof" 
                            className="max-w-none transition-transform duration-300 ease-out shadow-[0_0_100px_rgba(0,0,0,0.8)] rounded-lg cursor-grab active:cursor-grabbing" 
                            style={{ transform: `scale(${zoom})` }}
                            onClick={e => e.stopPropagation()}
                        />
                    </div>
                    
                    <div className="absolute bottom-8 px-6 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                        Use controls to zoom • Click background to exit
                    </div>
                </div>
            )}
        </div>
    );
};

export default BillingPayments;
