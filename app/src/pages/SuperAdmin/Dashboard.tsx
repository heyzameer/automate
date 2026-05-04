import React, { useState, useEffect } from 'react';
import {
    Users,
    Activity,
    CreditCard,
    Clock,
    LayoutGrid,
    Settings,
    ShieldCheck,
    Bell,
    Plus,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Cpu,
    Database,
    Server,
    Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../lib/api';
import { API_ENDPOINTS } from '../../constants/endpoints';
import { ROUTES } from '../../constants/routes';
import { Link } from 'react-router-dom';
import { formatDistanceToNow, differenceInDays } from 'date-fns';

interface SystemHealthService {
    name: string;
    status: string;
    latency: string;
    load: string;
}

interface RecentActivityItem {
    msg: string;
    time: string;
    level: string;
}

interface Stats {
    totalShowrooms: number;
    activeShowrooms: number;
    totalRevenue: number;
    upcomingExpiries: number;
    recentActivity: RecentActivityItem[];
    systemHealth: SystemHealthService[];
    securityAudit: { message: string; status: string };
}

interface Tenant {
    id: string;
    name: string;
    plan: string;
    isActive: boolean;
    verificationStatus: string;
    expiryDate: string;
    createdAt: string;
}

// ─── Stat Card ────────────────────────────────────────────────────
const StatCard = ({ title, value, icon: Icon, color, sub, delay }: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
    sub?: string;
    delay?: number;
}) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-50 relative overflow-hidden group"
    >
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-slate-50 rounded-full blur-2xl opacity-50 group-hover:bg-indigo-50 transition-colors duration-500" />
        <div className="flex items-start justify-between relative z-10">
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>
                <h3 className="mt-2 text-3xl font-black text-slate-900 tracking-tight">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                </h3>
                {sub && <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{sub}</p>}
            </div>
            <div className={`p-4 rounded-2xl shadow-lg ${color} text-white transform group-hover:scale-110 transition-transform duration-500`}>
                <Icon className="w-6 h-6" />
            </div>
        </div>
    </motion.div>
);

// ─── Skeleton ─────────────────────────────────────────────────────
const Skeleton = ({ className }: { className?: string }) => (
    <div className={`bg-slate-100 animate-pulse rounded-2xl ${className}`} />
);

// ─── Plan Badge ────────────────────────────────────────────────────
const PlanBadge = ({ plan }: { plan: string }) => {
    const map: Record<string, string> = {
        enterprise: 'bg-indigo-100 text-indigo-700',
        pro: 'bg-emerald-100 text-emerald-700',
        basic: 'bg-slate-100 text-slate-700',
        trial: 'bg-amber-100 text-amber-700',
        none: 'bg-rose-50 text-rose-400',
    };
    const cls = map[plan?.toLowerCase()] || 'bg-slate-100 text-slate-500';
    return (
        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${cls}`}>
            {plan || 'None'}
        </span>
    );
};

// ─── Main Component ────────────────────────────────────────────────
const SuperAdminDashboard = () => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [statsRes, tenantsRes] = await Promise.all([
                    api.get(API_ENDPOINTS.SUPER.STATS),
                    api.get(API_ENDPOINTS.SUPER.TENANTS),
                ]);
                setStats(statsRes.data.data);
                setTenants(tenantsRes.data.data || []);
            } catch (err: any) {
                console.error('Failed to load super admin data', err);
                setError('Failed to connect to management services.');
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    // ── Loading skeleton ──────────────────────────────────────────
    if (loading) {
        return (
            <div className="space-y-10 pb-20 animate-pulse">
                <div className="h-16 bg-slate-100 rounded-3xl w-1/3" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <Skeleton className="lg:col-span-2 h-80" />
                    <div className="space-y-6">
                        <Skeleton className="h-40" />
                        <Skeleton className="h-48" />
                    </div>
                </div>
            </div>
        );
    }

    // ── Error state ───────────────────────────────────────────────
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <AlertTriangle className="w-12 h-12 text-rose-400" />
                <p className="text-sm font-bold text-slate-500">{error}</p>
            </div>
        );
    }

    // Derived values
    const inactiveShowrooms = (stats?.totalShowrooms || 0) - (stats?.activeShowrooms || 0);
    const expiringTenants = tenants.filter(t => {
        const days = differenceInDays(new Date(t.expiryDate), new Date());
        return days >= 0 && days <= 30 && t.isActive;
    });

    const serviceIcon = (name: string) => {
        if (name.toLowerCase().includes('database') || name.toLowerCase().includes('mongo')) return Database;
        if (name.toLowerCase().includes('auth') || name.toLowerCase().includes('gateway')) return ShieldCheck;
        if (name.toLowerCase().includes('system') || name.toLowerCase().includes('core')) return Cpu;
        return Server;
    };

    return (
        <div className="space-y-10 pb-20">
            {/* ── Header ─────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-md border border-rose-100/50">System Root</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Overview</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Governance Hub</h1>
                    <p className="text-slate-500 font-medium mt-1">Manage global tenants, system configuration, and platform health.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        to={ROUTES.SUPER_ADMIN.SHOWROOMS}
                        className="inline-flex items-center justify-center px-8 py-3 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition shadow-xl shadow-slate-200 transform hover:-translate-y-0.5 active:translate-y-0 text-sm"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Manage Tenants
                    </Link>
                </div>
            </div>

            {/* ── Stats Grid ─────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Showrooms"
                    value={stats?.totalShowrooms || 0}
                    icon={Users}
                    color="bg-indigo-600"
                    sub={`${stats?.activeShowrooms || 0} active · ${inactiveShowrooms} inactive`}
                    delay={0.1}
                />
                <StatCard
                    title="Active Tenants"
                    value={stats?.activeShowrooms || 0}
                    icon={Activity}
                    color="bg-emerald-600"
                    sub="Currently operational"
                    delay={0.2}
                />
                <StatCard
                    title="Est. MRR"
                    value={`₹${(stats?.totalRevenue || 0).toLocaleString('en-IN')}`}
                    icon={CreditCard}
                    color="bg-slate-900"
                    sub="Based on active plan tiers"
                    delay={0.3}
                />
                <StatCard
                    title="Expiring Soon"
                    value={stats?.upcomingExpiries || 0}
                    icon={Clock}
                    color={stats?.upcomingExpiries ? 'bg-rose-500' : 'bg-slate-400'}
                    sub="Plans expiring within 30 days"
                    delay={0.4}
                />
            </div>

            {/* ── Main grid ──────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                {/* Platform Health — real OS + DB data from backend */}
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-50 p-10">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-slate-900 rounded-full" />
                            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Platform Health</h2>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            Live Metrics
                        </div>
                    </div>

                    {stats?.systemHealth && stats.systemHealth.length > 0 ? (
                        <div className="space-y-4">
                            {stats.systemHealth.map((service, idx) => {
                                const ServiceIcon = serviceIcon(service.name);
                                const isOperational = service.status.toLowerCase() === 'operational';
                                const loadNum = parseInt(service.load);
                                return (
                                    <div key={idx} className="flex items-center justify-between p-5 rounded-2xl border border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-white group-hover:shadow-md transition-all">
                                                <ServiceIcon className="w-5 h-5 text-slate-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">{service.name}</p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    {isOperational
                                                        ? <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                        : <XCircle className="w-3 h-3 text-rose-500" />
                                                    }
                                                    <p className={`text-[10px] font-black uppercase tracking-widest ${isOperational ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                        {service.status}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-8">
                                            <div className="text-right hidden sm:block">
                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Latency</p>
                                                <p className="text-xs font-bold text-slate-900">{service.latency}</p>
                                            </div>
                                            <div className="text-right min-w-[70px]">
                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Load</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${loadNum > 80 ? 'bg-rose-500' : loadNum > 60 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                                                            style={{ width: service.load }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-700">{service.load}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-16 text-center">
                            <LayoutGrid className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                            <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Health data unavailable</p>
                        </div>
                    )}

                    {/* Expiring Soon table — real tenant data */}
                    {expiringTenants.length > 0 && (
                        <div className="mt-10 pt-8 border-t border-slate-100">
                            <div className="flex items-center gap-2 mb-6">
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                                <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Expiring Within 30 Days</h3>
                            </div>
                            <div className="space-y-3">
                                {expiringTenants.map((t) => {
                                    const days = differenceInDays(new Date(t.expiryDate), new Date());
                                    return (
                                        <Link
                                            key={t.id}
                                            to={ROUTES.SUPER_ADMIN.SHOWROOM_DETAIL(t.id)}
                                            className="flex items-center justify-between p-4 bg-amber-50/50 rounded-2xl border border-amber-100 hover:bg-amber-50 transition-colors"
                                        >
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{t.name}</p>
                                                <PlanBadge plan={t.plan} />
                                            </div>
                                            <span className={`text-xs font-black ${days <= 7 ? 'text-rose-500' : 'text-amber-500'}`}>
                                                {days === 0 ? 'Expires Today' : `${days}d left`}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right column */}
                <div className="space-y-8">
                    {/* Security Audit — real server data */}
                    <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-slate-300 relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-600 rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity duration-1000" />
                        <div className="relative z-10">
                            <div className="bg-white/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                                <ShieldCheck className="text-indigo-400 w-6 h-6" />
                            </div>
                            <div className="flex items-center gap-2 mb-3">
                                <h3 className="font-black text-xl tracking-tight">Security Status</h3>
                                {stats?.securityAudit?.status && (
                                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-md">
                                        {stats.securityAudit.status}
                                    </span>
                                )}
                            </div>
                            <p className="text-slate-400 text-xs mb-8 leading-relaxed font-medium">
                                {stats?.securityAudit?.message || 'Syncing security nodes...'}
                            </p>
                            <Link
                                to={ROUTES.SUPER_ADMIN.SETTINGS}
                                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-white text-slate-900 rounded-2xl text-sm font-black transition transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Global Settings <Settings className="w-4 h-4 ml-1" />
                            </Link>
                        </div>
                    </div>

                    {/* Recent Activity — real new-tenant events from backend */}
                    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-50 p-10">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Recent Activity</h3>
                            <Bell className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="space-y-6">
                            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                                stats.recentActivity.map((alert, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className={`w-1 flex-shrink-0 rounded-full ${alert.level === 'warning' ? 'bg-rose-400' : 'bg-indigo-500'}`} />
                                        <div>
                                            <p className="text-xs font-bold text-slate-900 tracking-tight leading-snug">{alert.msg}</p>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{alert.time}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-8 text-center">
                                    <Zap className="w-6 h-6 text-slate-200 mx-auto mb-2" />
                                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No recent activity</p>
                                </div>
                            )}
                        </div>

                        {/* Quick Plan Breakdown from real tenants */}
                        {tenants.length > 0 && (
                            <div className="mt-8 pt-8 border-t border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Plan Distribution</p>
                                <div className="space-y-2">
                                    {(['enterprise', 'pro', 'basic', 'trial', 'none'] as const).map(plan => {
                                        const count = tenants.filter(t => t.plan?.toLowerCase() === plan).length;
                                        if (!count) return null;
                                        const pct = Math.round((count / tenants.length) * 100);
                                        return (
                                            <div key={plan}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{plan}</span>
                                                    <span className="text-[10px] font-black text-slate-700">{count}</span>
                                                </div>
                                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${pct}%` }}
                                                        transition={{ duration: 1, ease: 'easeOut' }}
                                                        className="h-full rounded-full bg-indigo-600"
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Recent Tenants Table ───────────────────────────── */}
            {tenants.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-50 p-10"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">All Showrooms</h2>
                        </div>
                        <Link
                            to={ROUTES.SUPER_ADMIN.SHOWROOMS}
                            className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                        >
                            Manage All →
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest pb-4">Showroom</th>
                                    <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest pb-4">Plan</th>
                                    <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest pb-4">Status</th>
                                    <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest pb-4">Expiry</th>
                                    <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest pb-4">Joined</th>
                                    <th />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {tenants.slice(0, 8).map((tenant) => {
                                    const daysLeft = differenceInDays(new Date(tenant.expiryDate), new Date());
                                    const isExpired = daysLeft < 0;
                                    const isExpiringSoon = !isExpired && daysLeft <= 30;
                                    return (
                                        <tr key={tenant.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="py-5 pr-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center font-black text-indigo-600 text-xs">
                                                        {tenant.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-900">{tenant.name}</p>
                                                </div>
                                            </td>
                                            <td className="py-5 pr-4">
                                                <PlanBadge plan={tenant.plan} />
                                            </td>
                                            <td className="py-5 pr-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${
                                                    tenant.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                                                }`}>
                                                    <span className={`w-1 h-1 rounded-full ${tenant.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                                    {tenant.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="py-5 pr-4">
                                                <span className={`text-xs font-bold ${isExpired ? 'text-rose-500' : isExpiringSoon ? 'text-amber-500' : 'text-slate-600'}`}>
                                                    {isExpired ? `Expired ${Math.abs(daysLeft)}d ago` : `${daysLeft}d left`}
                                                </span>
                                            </td>
                                            <td className="py-5 pr-4">
                                                <span className="text-xs font-bold text-slate-400">
                                                    {formatDistanceToNow(new Date(tenant.createdAt), { addSuffix: true })}
                                                </span>
                                            </td>
                                            <td className="py-5">
                                                <Link
                                                    to={ROUTES.SUPER_ADMIN.SHOWROOM_DETAIL(tenant.id)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                                                >
                                                    Manage
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default SuperAdminDashboard;
