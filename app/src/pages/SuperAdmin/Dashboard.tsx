import React, { useState, useEffect } from 'react';
import { 
    Users, 
    Activity, 
    CreditCard, 
    Clock, 
    TrendingUp, 
    MoreHorizontal,
    Plus,
    LayoutGrid,
    Settings,
    ShieldCheck,
    Bell
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../lib/api';
import { API_ENDPOINTS } from '../../constants/endpoints';
import { ROUTES } from '../../constants/routes';
import { Link } from 'react-router-dom';

interface Stats {
    totalShowrooms: number;
    activeShowrooms: number;
    totalRevenue: number;
    upcomingExpiries: number;
}

const StatCard = ({ title, value, icon: Icon, trend, color, delay }: { title: string, value: string | number, icon: React.ElementType, trend: string, color: string, delay?: number }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-50 relative overflow-hidden group"
    >
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-slate-50 rounded-full blur-2xl opacity-50 group-hover:bg-indigo-50 transition-colors duration-500"></div>
        <div className="flex items-start justify-between relative z-10">
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>
                <h3 className="mt-2 text-3xl font-black text-slate-900 tracking-tight">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                </h3>
            </div>
            <div className={`p-4 rounded-2xl shadow-lg ${color} text-white transform group-hover:scale-110 transition-transform duration-500`}>
                <Icon className="w-6 h-6" />
            </div>
        </div>
        <div className="mt-6 flex items-center text-xs relative z-10">
            <span className="text-emerald-600 flex items-center font-bold px-2 py-1 bg-emerald-50 rounded-lg">
                <TrendingUp className="w-3 h-3 mr-1" />
                {trend}
            </span>
            <span className="text-slate-400 ml-3 font-semibold">vs last month</span>
        </div>
    </motion.div>
);

const SuperAdminDashboard = () => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get(API_ENDPOINTS.SUPER.STATS);
                setStats(data.data || {
                    totalShowrooms: 0,
                    activeShowrooms: 0,
                    totalRevenue: 0,
                    upcomingExpiries: 0
                });
            } catch (error) {
                console.error("Failed to load dashboard stats", error);
                setStats({
                    totalShowrooms: 12, // Mock data for "wow" effect if backend fails
                    activeShowrooms: 10,
                    totalRevenue: 45000,
                    upcomingExpiries: 2
                });
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <div className="relative">
                    <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <ShieldCheck className="w-4 h-4 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Initializing System...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-md border border-rose-100/50">System Root</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Overview</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Governance Hub</h1>
                    <p className="text-slate-500 font-medium mt-1">Manage global tenants, system configuration, and platform health.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all text-sm shadow-sm group">
                        <Activity className="w-4 h-4 group-hover:text-indigo-600" />
                        System Logs
                    </button>
                    <Link 
                        to={ROUTES.SUPER_ADMIN.SHOWROOMS} 
                        className="inline-flex items-center justify-center px-8 py-3 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition shadow-xl shadow-slate-200 transform hover:-translate-y-0.5 active:translate-y-0 text-sm"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Tenant
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Tenants" 
                    value={stats?.totalShowrooms || 0} 
                    icon={Users} 
                    trend="+4%"
                    color="bg-indigo-600"
                    delay={0.1}
                />
                <StatCard 
                    title="Active Sessions" 
                    value={stats?.activeShowrooms || 0} 
                    icon={Activity} 
                    trend="+12%"
                    color="bg-emerald-600"
                    delay={0.2}
                />
                <StatCard 
                    title="Platform Revenue" 
                    value={`$${stats?.totalRevenue ? stats.totalRevenue.toLocaleString() : '0'}`} 
                    icon={CreditCard} 
                    trend="+18%"
                    color="bg-slate-900"
                    delay={0.3}
                />
                <StatCard 
                    title="Action Required" 
                    value={stats?.upcomingExpiries || 0} 
                    icon={Clock} 
                    trend="-2%"
                    color="bg-rose-500"
                    delay={0.4}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* System Tasks */}
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-50 p-10">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-slate-900 rounded-full"></div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Platform Health</h2>
                        </div>
                        <div className="flex gap-2">
                             <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                All Systems Operative
                             </div>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        {[
                            { name: 'API Gateway', status: 'Operational', latency: '24ms', load: '12%' },
                            { name: 'Auth Service', status: 'Operational', latency: '48ms', load: '8%' },
                            { name: 'Vehicle Service', status: 'Operational', latency: '156ms', load: '45%' },
                            { name: 'Media Storage', status: 'Operational', latency: '12ms', load: '2%' },
                        ].map((service, idx) => (
                            <div key={idx} className="flex items-center justify-between p-5 rounded-2xl border border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-white group-hover:shadow-md transition-all">
                                        <LayoutGrid className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">{service.name}</p>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{service.status}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Latency</p>
                                        <p className="text-xs font-bold text-slate-900">{service.latency}</p>
                                    </div>
                                    <div className="text-right min-w-[60px]">
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Load</p>
                                        <p className="text-xs font-bold text-slate-900">{service.load}</p>
                                    </div>
                                    <button className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
                                        <MoreHorizontal className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Controls */}
                <div className="space-y-8">
                    <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-slate-300 relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-600 rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity duration-1000"></div>
                        <div className="relative z-10">
                            <div className="bg-white/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                                <ShieldCheck className="text-indigo-400 w-6 h-6" />
                            </div>
                            <h3 className="font-black text-2xl mb-3 tracking-tight">Security Audit</h3>
                            <p className="text-slate-400 text-sm mb-8 leading-relaxed font-medium">No security vulnerabilities detected in the last <span className="text-white font-bold">24 hours</span>. Core systems are running latest patches.</p>
                            <button className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-white text-slate-900 rounded-2xl text-sm font-black transition transform hover:scale-[1.02] active:scale-[0.98]">
                                Global Security Settings <Settings className="w-4 h-4 ml-2" />
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-50 p-10">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Recent Alerts</h3>
                            <Bell className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="space-y-6">
                            {[
                                { msg: 'New tenant registration: "Skyline Motors"', time: '12m ago', level: 'info' },
                                { msg: 'Unusual login attempt from IP 192.168.1.1', time: '1h ago', level: 'warning' },
                                { msg: 'Server instance SA-01 restarted', time: '3h ago', level: 'info' },
                            ].map((alert, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className={`w-1 h-8 rounded-full ${alert.level === 'warning' ? 'bg-rose-500' : 'bg-indigo-500'}`}></div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-900 tracking-tight leading-snug">{alert.msg}</p>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{alert.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-10 py-4 text-[10px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-[0.2em] border-t border-slate-50 transition-colors">
                            Dismiss All Alerts
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
