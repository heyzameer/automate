import React, { useState, useEffect } from 'react';
import { Users, Activity, CreditCard, Clock, Loader2 } from 'lucide-react';
import api from '../../lib/api';

const SuperAdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Adjust endpoint if needed; assumes GET /super/dashboard/stats
                const { data } = await api.get('/super/dashboard/stats');
                setStats(data.data || {
                    totalShowrooms: 0,
                    activeShowrooms: 0,
                    totalRevenue: 0,
                    upcomingExpiries: 0
                });
            } catch (error) {
                console.error("Failed to load dashboard stats", error);
                // Fallback details if the route is not fully implemented
                setStats({
                    totalShowrooms: 0,
                    activeShowrooms: 0,
                    totalRevenue: 0,
                    upcomingExpiries: 0
                });
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    const StatCard = ({ title, value, icon: Icon, colorClass, bgColorClass }) => (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center gap-6 group hover:-translate-y-1 transition-transform duration-300">
            <div className={`p-4 rounded-2xl ${bgColorClass}`}>
                <Icon className={`w-8 h-8 ${colorClass}`} />
            </div>
            <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{title}</h3>
                <p className="text-3xl font-black text-slate-900 mt-1">{value}</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Super Admin Dashboard</h1>
                <p className="text-slate-500 font-medium mt-1">Platform overview and global statistics.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Showrooms" 
                    value={stats?.totalShowrooms || 0} 
                    icon={Users} 
                    colorClass="text-indigo-600" 
                    bgColorClass="bg-indigo-50" 
                />
                <StatCard 
                    title="Active Subscriptions" 
                    value={stats?.activeShowrooms || 0} 
                    icon={Activity} 
                    colorClass="text-emerald-600" 
                    bgColorClass="bg-emerald-50" 
                />
                <StatCard 
                    title="Total Revenue" 
                    value={`$${stats?.totalRevenue ? stats.totalRevenue.toLocaleString() : '0'}`} 
                    icon={CreditCard} 
                    colorClass="text-blue-600" 
                    bgColorClass="bg-blue-50" 
                />
                <StatCard 
                    title="Upcoming Expiries" 
                    value={stats?.upcomingExpiries || 0} 
                    icon={Clock} 
                    colorClass="text-rose-600" 
                    bgColorClass="bg-rose-50" 
                />
            </div>
            
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Placeholders for further features */}
                    <button className="p-4 border border-dashed border-slate-300 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 hover:border-indigo-400 hover:text-indigo-600 transition-colors">
                        Add New Partner
                    </button>
                    <button className="p-4 border border-dashed border-slate-300 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 hover:border-indigo-400 hover:text-indigo-600 transition-colors">
                        Review Access Logs
                    </button>
                    <button className="p-4 border border-dashed border-slate-300 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 hover:border-indigo-400 hover:text-indigo-600 transition-colors">
                        Configure Plans
                    </button>
                    <button className="p-4 border border-dashed border-slate-300 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 hover:border-indigo-400 hover:text-indigo-600 transition-colors">
                        Generate Report
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
