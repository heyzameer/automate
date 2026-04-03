import React, { useState } from 'react';
import { User, Shield, Bell, Key, Save, Loader2, MapPin, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

const ShowroomSettings = () => {
    const [user, setUser] = useState<{ fullName: string; email: string; phone?: string } | null>(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });
    const [address, setAddress] = useState('');
    const [locationUrl, setLocationUrl] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            toast.success("Profile updated successfully");
        }, 1000);
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Showroom Settings</h1>
                <p className="text-slate-500 font-medium mt-1">Configure your profile, security, and notification preferences.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Sidebar links for settings partitions */}
                <div className="space-y-1">
                    <button className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-slate-100 rounded-2xl font-bold text-sm text-indigo-600 shadow-sm">
                        <User size={18} /> Account Profile
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-2xl font-bold text-sm text-slate-500 transition-colors">
                        <Key size={18} /> Password & Security
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-2xl font-bold text-sm text-slate-500 transition-colors">
                        <Bell size={18} /> Notifications
                    </button>
                </div>

                {/* Main section */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-8">
                        <h3 className="text-lg font-bold text-slate-900 mb-6">Profile Information</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Display Name</label>
                                <input 
                                    type="text" 
                                    defaultValue={user?.fullName || ''}
                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-slate-900"
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Email Address</label>
                                <input 
                                    type="email" 
                                    disabled
                                    defaultValue={user?.email || ''}
                                    className="w-full px-5 py-3 bg-slate-100 border border-slate-100 rounded-2xl text-slate-400 font-bold opacity-70"
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Phone Number</label>
                                <input 
                                    type="text" 
                                    defaultValue="+91 9876543210"
                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-slate-900"
                                />
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 mb-6">Showroom Details (AI Bot Info)</h3>
                        <div className="grid grid-cols-2 gap-6 pb-6 border-b border-slate-50 mb-6">
                            <div className="col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-1">
                                    <MapPin size={10} /> Physical Address 
                                </label>
                                <textarea 
                                    rows={3}
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-slate-900"
                                    placeholder="Enter showroom address for the bot..."
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-1">
                                    <ExternalLink size={10} /> Google Maps Link
                                </label>
                                <input 
                                    type="text" 
                                    value={locationUrl}
                                    onChange={(e) => setLocationUrl(e.target.value)}
                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-slate-900"
                                    placeholder="https://maps.google.com/..."
                                />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button 
                                onClick={handleSave}
                                disabled={loading}
                                className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                Save Changes
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-8">
                        <div className="flex items-center gap-3 text-rose-600 mb-2">
                            <Shield size={20} />
                            <h3 className="font-bold">Dangerous Action</h3>
                        </div>
                        <p className="text-sm text-slate-500 font-medium mb-6">Closing your account will permanently delete all your showroom data, inventory, and lead history.</p>
                        <button className="bg-rose-100 text-rose-600 px-6 py-3 rounded-xl font-bold text-sm hover:bg-rose-200 transition-colors">
                            Request Deactivation
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShowroomSettings;
