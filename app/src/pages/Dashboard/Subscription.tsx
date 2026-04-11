import React, { useState, useEffect } from 'react';
import { 
  Package, Calendar, CheckCircle2, XCircle, Loader2, 
  CreditCard, AlertCircle, Upload, Clock, BadgeCheck, X, Send
} from 'lucide-react';
import { authService } from '../../services/auth.service';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const PLAN_FEATURES: Record<string, { label: string; badge: string; features: { name: string; value: string | boolean }[] }> = {
  trial:      { label: '🆓 Trial', badge: 'bg-slate-100 text-slate-600', features: [
    { name: 'Cars in inventory', value: '20' }, { name: 'Leads / month', value: '100' }, { name: 'Staff logins', value: '1' }, { name: 'Campaigns / month', value: '0' },
    { name: 'AI WhatsApp Bot', value: true }, { name: 'NLP Search', value: true }, { name: 'Image Sending', value: true },
    { name: 'Custom Welcome', value: false }, { name: 'Email Alerts', value: false }, { name: 'Email Campaigns', value: false },
    { name: 'Lead Scoring', value: false }, { name: 'New Arrival Broadcast', value: false },
    { name: 'Analytics', value: 'None' }, { name: 'Priority Support', value: false },
  ]},
  basic:      { label: '💼 Basic', badge: 'bg-blue-100 text-blue-700', features: [
    { name: 'Cars in inventory', value: '50' }, { name: 'Leads / month', value: '500' }, { name: 'Staff logins', value: '2' }, { name: 'Campaigns / month', value: '2' },
    { name: 'AI WhatsApp Bot', value: true }, { name: 'NLP Search', value: true }, { name: 'Image Sending', value: true },
    { name: 'Custom Welcome', value: true }, { name: 'Email Alerts', value: false }, { name: 'Email Campaigns', value: false },
    { name: 'Lead Scoring', value: false }, { name: 'New Arrival Broadcast', value: false },
    { name: 'Analytics', value: 'Basic' }, { name: 'Priority Support', value: false },
  ]},
  pro:        { label: '🚀 Pro', badge: 'bg-indigo-100 text-indigo-700', features: [
    { name: 'Cars in inventory', value: '200' }, { name: 'Leads / month', value: '2,000' }, { name: 'Staff logins', value: '5' }, { name: 'Campaigns / month', value: '10' },
    { name: 'AI WhatsApp Bot', value: true }, { name: 'NLP Search', value: true }, { name: 'Image Sending', value: true },
    { name: 'Custom Welcome', value: true }, { name: 'Email Alerts', value: true }, { name: 'Email Campaigns', value: true },
    { name: 'Lead Scoring', value: true }, { name: 'New Arrival Broadcast', value: true },
    { name: 'Analytics', value: 'Advanced' }, { name: 'Priority Support', value: true },
  ]},
  enterprise: { label: '🏢 Enterprise', badge: 'bg-amber-100 text-amber-700', features: [
    { name: 'Cars in inventory', value: 'Unlimited' }, { name: 'Leads / month', value: 'Unlimited' }, { name: 'Staff logins', value: 'Unlimited' }, { name: 'Campaigns / month', value: 'Unlimited' },
    { name: 'AI WhatsApp Bot', value: true }, { name: 'NLP Search', value: true }, { name: 'Image Sending', value: true },
    { name: 'Custom Welcome', value: true }, { name: 'Email Alerts', value: true }, { name: 'Email Campaigns', value: true },
    { name: 'Lead Scoring', value: true }, { name: 'New Arrival Broadcast', value: true },
    { name: 'Analytics', value: 'Full' }, { name: 'Priority Support', value: '✅ Dedicated' },
  ]},
  custom: { label: '⚙️ Custom', badge: 'bg-rose-100 text-rose-700', features: [] },
};

interface PaymentRequest {
  _id: string;
  amount: number;
  note: string;
  status: 'pending' | 'paid' | 'verified' | 'rejected';
  screenshotUrl?: string;
  createdAt: string;
  paidAt?: string;
  rejectReason?: string;
}

const Subscription = () => {
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [confirmModal, setConfirmModal] = useState<PaymentRequest | null>(null);
  const [confirmForm, setConfirmForm] = useState({ screenshotUrl: '', note: '' });
  const [submitting, setSubmitting] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const data = await authService.getMyTenant();
        if (data?.tenant) setTenant(data.tenant);
        const { data: pData } = await api.get('/auth/my-tenant/payment-requests');
        setPaymentRequests(pData.data || []);
      } catch {
        toast.error('Failed to load subscription info');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleConfirmPayment = async () => {
    if (!confirmModal) return;
    setSubmitting(true);
    try {
      await api.patch(`/auth/my-tenant/payment-requests/${confirmModal._id}/confirm`, confirmForm);
      setPaymentRequests(prev => prev.map(p => p._id === confirmModal._id ? { ...p, status: 'paid', screenshotUrl: confirmForm.screenshotUrl } : p));
      toast.success('Payment confirmation submitted!');
      setConfirmModal(null);
      setPreviewUrl(null);
      setConfirmForm({ screenshotUrl: '', note: '' });
    } catch {
      toast.error('Failed to confirm payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProofUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Max 10MB.');
      return;
    }
    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setUploadingProof(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/auth/upload/payment-proof', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const cloudUrl: string = data.data?.url || '';
      setConfirmForm(prev => ({ ...prev, screenshotUrl: cloudUrl }));
      toast.success('Screenshot uploaded!');
    } catch {
      toast.error('Upload failed — paste a URL manually instead.');
      setPreviewUrl(null);
    } finally {
      setUploadingProof(false);
    }
  };

  const openConfirmModal = (req: PaymentRequest) => {
    setConfirmModal(req);
    setConfirmForm({ screenshotUrl: '', note: '' });
    setPreviewUrl(null);
  };

  const planKey = String(tenant?.plan || 'basic').toLowerCase();
  const planDef = PLAN_FEATURES[planKey] || PLAN_FEATURES['basic'];
  const maxCars = tenant?.limits?.maxCars || 0;
  const maxLeads = tenant?.limits?.maxLeads || 0;
  const maxStaff = tenant?.limits?.maxStaff || 1;
  const maxCampaigns = tenant?.limits?.maxCampaignsPerMonth ?? 2;
  const isUnlimited = maxCars >= 999999;
  const botEnabled = tenant?.whatsappConfig?.botEnabled ?? true;
  const botConfigured = tenant?.whatsappConfig?.isActive ?? false;

  const pendingRequests = paymentRequests.filter(p => p.status === 'pending');

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Subscription</h1>
        <p className="text-slate-500 font-medium mt-1">Your active dealership plan, usage, and billing.</p>
      </div>

      {/* Active Plan Hero */}
      <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-900/20">
        <div className="absolute top-0 right-0 p-8 pointer-events-none">
          <Package className="text-white/5 w-64 h-64 -mr-16 -mt-16 rotate-12" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${tenant?.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                {tenant?.isActive ? '● Active' : '● Suspended'}
              </span>
              {botConfigured && (
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1.5 ${botEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
                  Bot {botEnabled ? 'Active' : 'Paused by Admin'}
                </span>
              )}
            </div>
            <h2 className="text-5xl font-black mt-4">{planDef.label}</h2>
            <p className="text-slate-400 mt-2 font-medium max-w-sm">AI-powered automation for your dealership with smart lead routing and inventory tracking.</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Renewal Date</p>
            <p className="text-xl font-black">
              {tenant?.expiryDate ? new Date(tenant.expiryDate).toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
            </p>
            {pendingRequests.length > 0 && (
              <div className="mt-4 px-4 py-2 bg-amber-400/20 border border-amber-400/30 rounded-xl text-amber-300 text-xs font-black uppercase tracking-widest">
                ₹{pendingRequests[0].amount} Payment Pending
              </div>
            )}
          </div>
        </div>

        {/* Usage bars */}
        <div className="relative z-10 grid grid-cols-3 gap-4 mt-8 bg-white/5 rounded-2xl p-6 border border-white/10">
          {[
            { label: 'Cars', used: tenant?.usage?.cars || 0, max: maxCars },
            { label: 'Leads', used: tenant?.usage?.leads || 0, max: maxLeads },
            { label: 'Staff', used: tenant?.usage?.staff || 1, max: maxStaff },
          ].map(({ label, used, max }) => {
            const pct = isUnlimited || max >= 999999 ? 0 : Math.min((used / max) * 100, 100);
            return (
              <div key={label}>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-xs uppercase font-bold text-slate-400 tracking-widest">{label}</span>
                  <span className="text-xs font-black text-white">{used} / {max >= 999999 ? '∞' : max}</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full">
                  <div className={`h-full rounded-full transition-all ${pct > 80 ? 'bg-rose-400' : 'bg-indigo-400'}`} style={{ width: max >= 999999 ? '10%' : `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Plan Features */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl p-8">
          <h3 className="text-lg font-black text-slate-900 mb-6">Included Features</h3>
          <div className="space-y-3">
            {planDef.features.map(feat => (
              <div key={feat.name} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <span className="text-sm font-bold text-slate-700">{feat.name}</span>
                {typeof feat.value === 'boolean' ? (
                  feat.value ? <CheckCircle2 size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-slate-300" />
                ) : (
                  <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{feat.value}</span>
                )}
              </div>
            ))}
            {planKey === 'custom' && tenant?.features && (
              <>
                <div className="flex items-center justify-between py-2 border-b border-slate-50"><span className="text-sm font-bold text-slate-700">Cars</span><span className="text-xs font-black text-indigo-600">{maxCars >= 999999 ? '∞' : maxCars}</span></div>
                <div className="flex items-center justify-between py-2 border-b border-slate-50"><span className="text-sm font-bold text-slate-700">Leads</span><span className="text-xs font-black text-indigo-600">{maxLeads >= 999999 ? '∞' : maxLeads}</span></div>
                <div className="flex items-center justify-between py-2 border-b border-slate-50"><span className="text-sm font-bold text-slate-700">Staff logins</span><span className="text-xs font-black text-indigo-600">{maxStaff >= 999999 ? '∞' : maxStaff}</span></div>
                <div className="flex items-center justify-between py-2 border-b border-slate-50"><span className="text-sm font-bold text-slate-700">Custom Welcome</span>{tenant.features.customWelcome ? <CheckCircle2 size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-slate-300" />}</div>
                <div className="flex items-center justify-between py-2 border-b border-slate-50"><span className="text-sm font-bold text-slate-700">Analytics</span><span className="text-xs font-black text-indigo-600 uppercase">{tenant.features.analyticsLevel}</span></div>
              </>
            )}
          </div>
        </div>

        {/* Billing / Payment Requests */}
        <div className="space-y-6">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-900">Payment Requests</h3>
              <CreditCard size={20} className="text-slate-400" />
            </div>
            
            {paymentRequests.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <CreditCard size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-bold">No payment requests yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {paymentRequests.map((req) => (
                  <div key={req._id} className={`p-4 rounded-2xl border ${req.status === 'pending' ? 'border-amber-200 bg-amber-50' : req.status === 'paid' ? 'border-emerald-100 bg-emerald-50' : 'border-slate-100 bg-slate-50'}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-slate-900">₹{req.amount.toLocaleString()}</span>
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${
                            req.status === 'pending' ? 'bg-amber-200 text-amber-700' :
                            req.status === 'paid' ? 'bg-indigo-200 text-indigo-700' : 
                            req.status === 'verified' ? 'bg-emerald-200 text-emerald-700' : 'bg-slate-200 text-slate-600'
                          }`}>{req.status === 'paid' ? 'Proof Uploaded' : req.status}</span>
                        </div>
                        {req.note && <p className="text-xs font-medium text-slate-600 mt-1">{req.note}</p>}
                        {req.status === 'rejected' && req.rejectReason && (
                          <div className="mt-2 bg-rose-50 text-rose-600 text-[11px] p-2 rounded-xl font-bold border border-rose-100/50 block">
                            <span className="uppercase tracking-widest text-[9px] text-rose-400 block mb-0.5">Admin Note</span>
                            {req.rejectReason}
                          </div>
                        )}
                        <p className="text-[10px] text-slate-400 mt-1 font-bold">{new Date(req.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                      {['pending', 'rejected'].includes(req.status) && (
                        <button onClick={() => openConfirmModal(req)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1 hover:bg-indigo-700">
                          <BadgeCheck size={12} /> {req.status === 'rejected' ? 'Re-upload Proof' : 'Upload Proof'}
                        </button>
                      )}
                      {(req.status === 'paid' || req.status === 'verified') && req.screenshotUrl && (
                        <a href={req.screenshotUrl} target="_blank" rel="noreferrer" className="text-indigo-600 text-xs font-bold underline">View Proof</a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expiry Alert */}
          {tenant?.expiryDate && (() => {
            const daysLeft = Math.ceil((new Date(tenant.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            if (daysLeft <= 30) return (
              <div className="bg-orange-50 rounded-[2rem] p-6 border border-orange-100 flex items-start gap-3">
                <AlertCircle size={20} className="text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-orange-800 mb-1">Subscription Expiring Soon</h4>
                  <p className="text-sm text-orange-700 font-medium">Your plan expires in <strong>{daysLeft} days</strong>. Contact support to renew.</p>
                </div>
              </div>
            );
            return null;
          })()}
        </div>
      </div>

      {/* Payment Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-white">Confirm Payment</h2>
                  <p className="text-sm font-bold text-indigo-300 mt-0.5">Amount: ₹{confirmModal.amount.toLocaleString()}</p>
                </div>
                <button onClick={() => { setConfirmModal(null); setPreviewUrl(null); setConfirmForm({ screenshotUrl: '', note: '' }); }} className="p-2 rounded-xl bg-white/10 text-white/70 hover:bg-white/20 transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-5">
              {/* Screenshot Upload Zone */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">
                  Payment Screenshot / Proof
                </label>

                {!previewUrl ? (
                  <label
                    htmlFor="proof-upload"
                    onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-indigo-400', 'bg-indigo-50'); }}
                    onDragLeave={e => { e.currentTarget.classList.remove('border-indigo-400', 'bg-indigo-50'); }}
                    onDrop={e => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('border-indigo-400', 'bg-indigo-50');
                      const file = e.dataTransfer.files[0];
                      if (file) handleProofUpload(file);
                    }}
                    className="flex flex-col items-center justify-center gap-3 w-full h-40 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all group"
                  >
                    {uploadingProof ? (
                      <>
                        <Loader2 size={32} className="text-indigo-500 animate-spin" />
                        <p className="text-xs font-bold text-indigo-500">Uploading...</p>
                      </>
                    ) : (
                      <>
                        <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 group-hover:border-indigo-200 transition-colors">
                          <Upload size={22} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-slate-700">Drop screenshot here</p>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">or click to browse</p>
                        </div>
                        <p className="text-[10px] text-slate-400">JPG, PNG, WEBP up to 10MB</p>
                      </>
                    )}
                    <input
                      id="proof-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleProofUpload(file);
                      }}
                    />
                  </label>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                    <img src={previewUrl} alt="Payment proof" className="w-full object-cover max-h-52" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-3 left-3 flex items-center gap-2">
                      {uploadingProof ? (
                        <span className="flex items-center gap-2 px-3 py-1.5 bg-white/90 rounded-xl text-xs font-bold text-indigo-700">
                          <Loader2 size={12} className="animate-spin" /> Uploading...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 rounded-xl text-xs font-bold text-white">
                          <BadgeCheck size={12} /> Uploaded
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => { setPreviewUrl(null); setConfirmForm(p => ({ ...p, screenshotUrl: '' })); }}
                      className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-xl text-slate-600 hover:bg-white shadow"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Manual URL fallback */}
                {!previewUrl && (
                  <div className="mt-3">
                    <p className="text-[10px] text-slate-400 font-medium text-center mb-2">— or paste a Drive / Dropbox link —</p>
                    <input
                      type="text"
                      value={confirmForm.screenshotUrl}
                      onChange={e => setConfirmForm({ ...confirmForm, screenshotUrl: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-medium text-sm text-slate-700"
                      placeholder="https://drive.google.com/..."
                    />
                  </div>
                )}
              </div>

              {/* Transaction Note */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Transaction / Reference Note</label>
                <textarea
                  rows={2}
                  value={confirmForm.note}
                  onChange={e => setConfirmForm({ ...confirmForm, note: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-medium text-sm resize-none"
                  placeholder="UPI Ref: 123456789 — Paid via GPay"
                />
              </div>

              <div className="flex gap-3 justify-end pt-1">
                <button onClick={() => { setConfirmModal(null); setPreviewUrl(null); setConfirmForm({ screenshotUrl: '', note: '' }); }} className="px-5 py-2.5 font-bold text-slate-500 hover:bg-slate-50 rounded-xl">Cancel</button>
                <button
                  onClick={handleConfirmPayment}
                  disabled={submitting || (!confirmForm.screenshotUrl) || uploadingProof}
                  className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 disabled:opacity-50 transition-all"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <BadgeCheck size={16} />}
                  Submit Proof
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Subscription;
