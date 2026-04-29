import React, { useState, useEffect } from 'react';
import {
  User, Save, Loader2, MapPin, ExternalLink, Lock,
  Building2, Eye, EyeOff, Shield, CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../../services/auth.service';
import { tenantService } from '../../services/tenant.service';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

// ─── Input Component ──────────────────────────────────────────────────────────
const Field = ({
  label, value, onChange, type = 'text', placeholder = '', disabled = false,
  error, endIcon, hint
}: {
  label: string; value: string; onChange?: (v: string) => void;
  type?: string; placeholder?: string; disabled?: boolean;
  error?: string; endIcon?: React.ReactNode; hint?: string;
}) => (
  <div>
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">{label}</label>
    <div className="relative">
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={e => onChange?.(e.target.value)}
        className={`w-full px-5 py-3 border rounded-2xl focus:outline-none transition-all font-semibold text-sm text-slate-900 pr-12
          ${disabled ? 'bg-slate-100 border-slate-100 text-slate-400 cursor-not-allowed opacity-70' : 'bg-slate-50 border-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'}
          ${error ? '!border-rose-400 !bg-rose-50 focus:ring-rose-500/20 focus:border-rose-500' : ''}
        `}
        placeholder={placeholder}
      />
      {endIcon && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">{endIcon}</div>
      )}
    </div>
    {error && <p className="mt-1.5 text-xs font-bold text-rose-500">{error}</p>}
    {hint && !error && <p className="mt-1.5 text-xs text-slate-400 font-medium">{hint}</p>}
  </div>
);

// ─── Section Card ─────────────────────────────────────────────────────────────
const Section = ({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) => (
  <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-8">
    <div className="mb-6">
      <h3 className="text-lg font-black text-slate-900">{title}</h3>
      {subtitle && <p className="text-xs text-slate-400 font-medium mt-1">{subtitle}</p>}
    </div>
    {children}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const ShowroomSettings = () => {
  const [user, setUser] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  // Profile fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  // Showroom fields
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [locationUrl, setLocationUrl] = useState('');



  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Loading states
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingShowroom, setSavingShowroom] = useState(false);
  
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });
  const [savingPassword, setSavingPassword] = useState(false);

  // Errors
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [showroomErrors, setShowroomErrors] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const storedUser = authService.getStoredUser() as any;
        if (storedUser) {
          setUser(storedUser);
          setFullName(storedUser.fullName || '');
          setPhone(storedUser.phone || '');
        }
        const tenantRes: any = await tenantService.getMyTenant();
        const t = tenantRes?.tenant || tenantRes;
        if (t) {
          setBusinessName(t.name || '');
          setAddress(t.address || '');
          setLocationUrl(t.locationUrl || '');
        }
      } catch {
        toast.error('Failed to load settings');
      } finally {
        setFetching(false);
      }
    };
    load();
  }, []);

  // ── Profile Save ────────────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = 'Full Name is required.';
    if (phone && !/^\+?[0-9\s\-()]{7,15}$/.test(phone)) errs.phone = 'Enter a valid phone number.';
    setProfileErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSavingProfile(true);
    try {
      const updated = await authService.updateProfile({ fullName, phone });
      setUser(updated);
      toast.success('Profile updated!');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Showroom Save ───────────────────────────────────────────────────────────
  const handleSaveShowroom = async () => {
    const errs: Record<string, string> = {};
    if (!businessName.trim()) errs.businessName = 'Business Name is required.';
    if (!address.trim()) errs.address = 'Physical Address is required.';
    if (locationUrl && !/^(https?:\/\/)?([\w\d-]+\.)+[\w\d]{2,}(\/.*)?$/.test(locationUrl))
      errs.locationUrl = 'Enter a valid URL.';
    setShowroomErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSavingShowroom(true);
    try {
      await tenantService.updateMyTenant({ name: businessName, address, locationUrl } as any);
      toast.success('Showroom details updated!');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to update showroom details');
    } finally {
      setSavingShowroom(false);
    }
  };



  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  // ── Password Save ───────────────────────────────────────────────────────────
  const handleSavePassword = async () => {
    const errs: Record<string, string> = {};
    if (!currentPassword) errs.currentPassword = 'Current password is required.';
    if (!newPassword || newPassword.length < 6) errs.newPassword = 'New password must be at least 6 characters.';
    if (newPassword !== confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    setPasswordErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSavingPassword(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      toast.success('Password changed successfully!');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const EyeToggle = ({ show, onToggle }: { show: boolean; onToggle: () => void }) => (
    <button type="button" onClick={onToggle} className="text-slate-400 hover:text-slate-600 transition-colors">
      {show ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );

  return (
    <div className="space-y-8 max-w-3xl">
      <ConfirmModal 
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500 font-medium mt-1">Manage your profile, showroom details, and account security.</p>
      </div>

      {/* ── Profile Information ── */}
      <Section
        title="Profile Information"
        subtitle="Your personal account details"
      >
        <div className="grid grid-cols-2 gap-5">
          <div className="col-span-2">
            <Field
              label="Full Name"
              value={fullName}
              onChange={v => { setFullName(v); setProfileErrors(p => ({ ...p, fullName: '' })); }}
              placeholder="John Doe"
              error={profileErrors.fullName}
            />
          </div>
          <div className="col-span-1">
            <Field
              label="Email Address"
              value={user?.email || ''}
              disabled
              hint="Email cannot be changed"
            />
          </div>
          <div className="col-span-1">
            <Field
              label="Phone Number"
              value={phone}
              onChange={v => { setPhone(v); setProfileErrors(p => ({ ...p, phone: '' })); }}
              placeholder="+91 98765 43210"
              error={profileErrors.phone}
            />
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <button
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100/60 disabled:opacity-50"
          >
            {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Profile
          </button>
        </div>
      </Section>

      {/* ── Showroom Details ── */}
      <Section
        title="Showroom Details"
        subtitle="Used by the AI bot to identify your dealership"
      >
        <div className="space-y-5">
          <Field
            label="Business / Showroom Name"
            value={businessName}
            onChange={v => { setBusinessName(v); setShowroomErrors(p => ({ ...p, businessName: '' })); }}
            placeholder="Unique Cars Pvt Ltd"
            error={showroomErrors.businessName}
          />
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-1">
              <MapPin size={10} /> Physical Address
            </label>
            <textarea
              rows={3}
              value={address}
              onChange={e => { setAddress(e.target.value); setShowroomErrors(p => ({ ...p, address: '' })); }}
              className={`w-full px-5 py-3 bg-slate-50 border rounded-2xl focus:outline-none transition-all font-semibold text-sm text-slate-900 resize-none
                ${showroomErrors.address ? 'border-rose-400 focus:ring-2 focus:ring-rose-500/20' : 'border-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'}`}
              placeholder="Shop No. 12, MG Road, Bangalore 560001"
            />
            {showroomErrors.address && <p className="mt-1.5 text-xs font-bold text-rose-500">{showroomErrors.address}</p>}
          </div>
          <Field
            label="Google Maps Link"
            value={locationUrl}
            onChange={v => { setLocationUrl(v); setShowroomErrors(p => ({ ...p, locationUrl: '' })); }}
            placeholder="https://maps.google.com/..."
            error={showroomErrors.locationUrl}
            endIcon={<ExternalLink size={14} />}
            hint="Shared with customers who ask the bot for your location"
          />
        </div>
        <div className="flex justify-end mt-6">
          <button
            onClick={handleSaveShowroom}
            disabled={savingShowroom}
            className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100/60 disabled:opacity-50"
          >
            {savingShowroom ? <Loader2 size={16} className="animate-spin" /> : <Building2 size={16} />}
            Save Showroom
          </button>
        </div>
      </Section>



      {/* ── Change Password ── */}
      <Section
        title="Change Password"
        subtitle="Update your account password"
      >
        <div className="space-y-5">
          <Field
            label="Current Password"
            type={showCurrent ? 'text' : 'password'}
            value={currentPassword}
            onChange={v => { setCurrentPassword(v); setPasswordErrors(p => ({ ...p, currentPassword: '' })); }}
            placeholder="Enter current password"
            error={passwordErrors.currentPassword}
            endIcon={<EyeToggle show={showCurrent} onToggle={() => setShowCurrent(v => !v)} />}
          />
          <div className="grid grid-cols-2 gap-5">
            <Field
              label="New Password"
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={v => { setNewPassword(v); setPasswordErrors(p => ({ ...p, newPassword: '', confirmPassword: '' })); }}
              placeholder="Min. 6 characters"
              error={passwordErrors.newPassword}
              endIcon={<EyeToggle show={showNew} onToggle={() => setShowNew(v => !v)} />}
            />
            <Field
              label="Confirm New Password"
              type={showNew ? 'text' : 'password'}
              value={confirmPassword}
              onChange={v => { setConfirmPassword(v); setPasswordErrors(p => ({ ...p, confirmPassword: '' })); }}
              placeholder="Re-enter new password"
              error={passwordErrors.confirmPassword}
            />
          </div>

          {/* Password strength hint */}
          {newPassword.length > 0 && (
            <div className="flex items-center gap-2">
              <div className={`h-1.5 flex-1 rounded-full ${newPassword.length >= 8 ? 'bg-emerald-500' : newPassword.length >= 6 ? 'bg-amber-400' : 'bg-rose-400'}`} />
              <span className={`text-xs font-bold ${newPassword.length >= 8 ? 'text-emerald-600' : newPassword.length >= 6 ? 'text-amber-600' : 'text-rose-500'}`}>
                {newPassword.length >= 8 ? 'Strong' : newPassword.length >= 6 ? 'Fair' : 'Weak'}
              </span>
            </div>
          )}
        </div>
        <div className="flex justify-end mt-6">
          <button
            onClick={handleSavePassword}
            disabled={savingPassword}
            className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-50"
          >
            {savingPassword ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
            Update Password
          </button>
        </div>
      </Section>
    </div>
  );
};

export default ShowroomSettings;
