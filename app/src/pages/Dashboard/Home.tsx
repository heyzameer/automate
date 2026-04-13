import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Car, 
    CheckCircle, 
    MessageCircle, 
    TrendingUp, 
    ArrowUpRight, 
    Plus, 
    ExternalLink,
    Zap,
    Users,
    Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { analyticsService, DashboardStats } from '../../services/analytics.service';
import { formatDistanceToNow } from 'date-fns';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
    trend: string;
    delay: number;
}

const StatCard = ({ title, value, icon: Icon, color, trend, delay }: StatCardProps) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-50 relative overflow-hidden group"
    >
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-slate-50 rounded-full blur-2xl opacity-50 group-hover:bg-indigo-50 transition-colors duration-500"></div>
        <div className="flex items-start justify-between relative z-10">
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
                <h3 className="mt-2 text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
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
            <span className="text-slate-400 ml-3 font-semibold tracking-tight">vs last month</span>
        </div>
    </motion.div>
);

interface ActivityItemProps {
    title: string;
    time: string;
    type: 'lead' | 'sold' | 'listing';
}

const ActivityItem = ({ title, time, type }: ActivityItemProps) => (
    <div className="flex items-center gap-4 py-5 group cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50/50 -mx-4 px-4 rounded-xl transition-colors">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-110 ${
            type === 'lead' ? 'bg-emerald-50 text-emerald-600' :
            type === 'sold' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-600'
        }`}>
            {type === 'lead' ? <MessageCircle className="w-5 h-5 font-bold" /> :
             type === 'sold' ? <CheckCircle className="w-5 h-5 font-bold" /> : <Zap className="w-5 h-5 font-bold" />}
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{title}</p>
            <p className="text-[10px] text-slate-400 mt-1 font-black uppercase tracking-widest">{time}</p>
        </div>
        <button className="p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 hover:border-indigo-100 shadow-sm">
            <ArrowUpRight size={14} />
        </button>
    </div>
)

export default function DashboardHome() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await analyticsService.getDashboardStats();
                setStats(data);
            } catch (err) {
                console.error("Failed to load dashboard stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const formatCurrency = (val: number) => {
        if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
        if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
        return `₹${val.toLocaleString()}`;
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
            <p className="text-slate-400 font-bold animate-pulse uppercase tracking-widest text-xs text-center">Crunching Dealer Intelligence...</p>
        </div>
    );

    const totalLeads = stats?.funnel.stages.reduce((acc, s) => acc + s.count, 0) || 0;
    const inventoryDist = stats?.inventory.brandDistribution || [];
    const totalVehicles = stats?.inventory.totalStock || 0;

    return (
        <div className="space-y-10 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Command Center</h1>
                    <p className="text-slate-500 font-medium mt-2">Scale your operations with real-time dealership insights.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="hidden sm:flex px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all text-sm shadow-sm">
                        View Analytics
                    </button>
                    <Link to={ROUTES.VEHICLES.ADD} className="inline-flex items-center justify-center px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition shadow-xl shadow-indigo-100 transform hover:-translate-y-0.5 active:translate-y-0 text-sm">
                        <Plus className="w-5 h-5 mr-2" />
                        List Vehicle
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Active Stock"
                    value={totalVehicles}
                    icon={Car}
                    color="bg-indigo-600"
                    trend="+12%"
                    delay={0.1}
                />
                <StatCard
                    title="Conversion Rate"
                    value={`${stats?.funnel.conversionRate || 0}%`}
                    icon={CheckCircle}
                    color="bg-emerald-600"
                    trend="+5%"
                    delay={0.2}
                />
                <StatCard
                    title="Total Revenue"
                    value={formatCurrency(stats?.revenue.totalRevenue || 0)}
                    icon={TrendingUp}
                    color="bg-slate-900"
                    trend={`${stats?.revenue.monthlyGrowth || 0}%`}
                    delay={0.3}
                />
                <StatCard
                    title="Monthly Leads"
                    value={totalLeads}
                    icon={MessageCircle}
                    color="bg-indigo-600"
                    trend="+42%"
                    delay={0.4}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-50 p-10">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Recent Activity</h2>
                        </div>
                        <button className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-[0.2em] flex items-center bg-indigo-50 px-4 py-2 rounded-xl transition-all">
                            View Cloud Logs <ArrowUpRight className="w-3 h-3 ml-2" />
                        </button>
                    </div>
                    <div className="space-y-2">
                        {stats?.recentActivity?.length ? stats.recentActivity.map((activity, idx) => (
                            <ActivityItem 
                                key={`activity-${activity.id || idx}`}
                                title={activity.title} 
                                time={formatDistanceToNow(new Date(activity.time), { addSuffix: true })} 
                                type={activity.type} 
                            />
                        )) : (
                            <p className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-xs">No recent activity detected</p>
                        )}
                    </div>
                </div>

                {/* Quick Actions & Tips */}
                <div className="space-y-8">
                    <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-slate-300 relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-600 rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity duration-1000"></div>
                        <div className="relative z-10">
                            <div className="bg-white/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                                <Zap className="text-indigo-400 w-6 h-6 fill-indigo-400" />
                            </div>
                            <h3 className="font-black text-2xl mb-3 tracking-tight">AI Sales Bot</h3>
                            <p className="text-slate-400 text-sm mb-8 leading-relaxed font-medium">Your AI bot is currently handling <span className="text-white font-bold text-lg">12</span> active conversations on WhatsApp.</p>
                            <Link to={ROUTES.AUTOMATION.WHATSAPP} className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-white text-slate-900 rounded-2xl text-sm font-black transition transform hover:scale-[1.02] active:scale-[0.98]">
                                View Bot Status <ExternalLink className="w-4 h-4 ml-2" />
                            </Link>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-50 p-10">
                        <h3 className="font-black text-slate-900 mb-8 uppercase text-sm tracking-widest text-center">Inventory Health</h3>
                        <div className="space-y-8">
                            {inventoryDist.length ? inventoryDist.slice(0, 3).map((item, idx) => {
                                const percentage = totalVehicles > 0 ? Math.round((item.count / totalVehicles) * 100) : 0;
                                return (
                                    <div key={`brand-${item.brand || idx}`}>
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-3">
                                            <span className="text-slate-400">{item.brand}</span>
                                            <span className={`px-2 py-0.5 rounded-md ${idx === 0 ? 'text-indigo-600 bg-indigo-50' : 'text-slate-900 bg-slate-100'}`}>
                                                {percentage}%
                                            </span>
                                        </div>
                                        <div className="h-4 bg-slate-50 rounded-full overflow-hidden p-1 shadow-inner border border-slate-100">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percentage}%` }}
                                                transition={{ duration: 1.5, ease: "easeOut" }}
                                                className={`h-full rounded-full ${idx === 0 ? 'bg-indigo-600 shadow-lg shadow-indigo-200' : 'bg-slate-900'}`}
                                            ></motion.div>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <p className="text-center py-10 text-slate-300 font-bold uppercase tracking-widest text-[10px]">Stock incoming...</p>
                            )}
                        </div>
                        
                        <div className="mt-10 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                             <div className="flex items-center gap-3">
                                <Users className="text-indigo-600" size={20} />
                                <div className="flex-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Top Sales Staff</p>
                                    <p className="text-sm font-bold text-slate-900 mt-1 uppercase tracking-tight">Rahul Sharma</p>
                                </div>
                                <div className="text-emerald-600 font-black text-sm tracking-tighter">12 Sales</div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
