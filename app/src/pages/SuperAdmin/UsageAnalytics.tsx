import React, { useState, useEffect } from 'react';
import { 
    BarChart3, Calendar, Filter, Loader2, 
    ArrowUpRight, ArrowDownRight, Bot, Cpu, 
    Monitor, LayoutGrid, Search, Download
} from 'lucide-react';
import api from '../../lib/api';
import { API_ENDPOINTS } from '../../constants/endpoints';
import toast from 'react-hot-toast';

interface UsageStat {
    _id: string;
    tenantId: {
        _id: string;
        name: string;
        slug: string;
    };
    service: 'bot' | 'gemini' | 'kiosk' | 'inventory';
    count: number;
    date: string;
}

const UsageAnalytics = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<UsageStat[]>([]);
    const [tenants, setTenants] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState({
        tenantId: '',
        service: '',
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, tenantsRes] = await Promise.all([
                api.get(API_ENDPOINTS.SUPER.USAGE, { params: { ...filters, page, limit: 10 } }),
                api.get(API_ENDPOINTS.SUPER.TENANTS)
            ]);
            setStats(statsRes.data.data.data);
            setTotal(statsRes.data.data.total);
            setTenants(tenantsRes.data.data);
            setLastUpdated(new Date());
        } catch (error) {
            toast.error("Failed to fetch analytics");
        } finally {
            setLoading(false);
        }
    };

    const [lastUpdated, setLastUpdated] = useState(new Date());

    useEffect(() => {
        setPage(1);
    }, [filters]);

    useEffect(() => {
        fetchData();
    }, [filters, page]);

    const serviceIcons = {
        bot: <Bot size={18} className="text-indigo-500" />,
        gemini: <Cpu size={18} className="text-purple-500" />,
        kiosk: <Monitor size={18} className="text-emerald-500" />,
        inventory: <LayoutGrid size={18} className="text-orange-500" />,
        campaign: <ArrowUpRight size={18} className="text-blue-500" />
    };

    const totals = stats.reduce((acc, curr) => {
        acc[curr.service] = (acc[curr.service] || 0) + curr.count;
        acc.total = (acc.total || 0) + curr.count;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        API Usage Analytics
                        <span className="bg-slate-900 text-white text-[10px] px-3 py-1 rounded-full uppercase tracking-tighter">Live Monitor</span>
                    </h1>
                    <p className="text-slate-500 font-medium mt-1 flex items-center gap-2">
                        Track request volume and AI consumption across all showrooms.
                        <span className="inline-block w-1 h-1 rounded-full bg-slate-300" />
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                            Last Refreshed: {lastUpdated.toLocaleTimeString()}
                        </span>
                    </p>
                </div>
                <button 
                    onClick={() => fetchData()}
                    className="flex items-center gap-2 bg-white border border-slate-100 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                >
                    <Download size={16} /> Export CSV
                </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {[
                    { label: 'Bot Requests', value: totals.bot || 0, icon: Bot, color: 'indigo' },
                    { label: 'Gemini (AI)', value: totals.gemini || 0, icon: Cpu, color: 'purple' },
                    { label: 'Kiosk API', value: totals.kiosk || 0, icon: Monitor, color: 'emerald' },
                    { label: 'Inventory Sync', value: totals.inventory || 0, icon: LayoutGrid, color: 'orange' },
                    { label: 'Campaigns', value: totals.campaign || 0, icon: ArrowUpRight, color: 'blue' }
                ].map((m, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-50 shadow-xl shadow-slate-100/50 group hover:scale-[1.02] transition-all duration-500">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-2xl bg-${m.color}-50 text-${m.color}-600 group-hover:rotate-12 transition-transform`}>
                                <m.icon size={24} />
                            </div>
                            <span className="flex items-center gap-1 text-indigo-500 font-bold text-[10px] uppercase tracking-widest animate-pulse">
                                ● Live
                            </span>
                        </div>
                        <p className="text-slate-400 text-xs font-black uppercase tracking-widest">{m.label}</p>
                        <h2 className="text-3xl font-black text-slate-900 mt-1 tabular-nums">{m.value.toLocaleString()}</h2>
                    </div>
                ))}
            </div>

            {/* Filters Bar */}
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-slate-200">
                <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-3">
                        <Filter size={18} className="text-slate-400" />
                        <span className="font-bold text-sm">Filters:</span>
                    </div>

                    <div className="flex-1 min-w-[200px]">
                        <select 
                            value={filters.tenantId}
                            onChange={(e) => setFilters({...filters, tenantId: e.target.value})}
                            className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                        >
                            <option value="">All Showrooms</option>
                            {tenants.map(t => (
                                <option key={t.id || t._id} value={t.id || t._id}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-1 min-w-[180px]">
                        <select 
                            value={filters.service}
                            onChange={(e) => setFilters({...filters, service: e.target.value})}
                            className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                        >
                            <option value="">All Service Types</option>
                            <option value="bot">Bot Requests</option>
                            <option value="gemini">Gemini (AI)</option>
                            <option value="kiosk">Kiosk API</option>
                            <option value="inventory">Inventory Sync</option>
                            <option value="campaign">Campaigns</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-800 rounded-xl px-4 py-2">
                        <Calendar size={18} className="text-slate-400" />
                        <input 
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                            className="bg-transparent border-none text-sm font-bold focus:ring-0 cursor-pointer p-1"
                        />
                        <span className="text-slate-500 font-bold">to</span>
                        <input 
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                            className="bg-transparent border-none text-sm font-bold focus:ring-0 cursor-pointer p-1"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-900">Request Logs</h3>
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search logs..."
                            className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Showroom</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Service</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Requests</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
                                        <p className="text-slate-400 font-bold mt-4">Crunching usage data...</p>
                                    </td>
                                </tr>
                            ) : stats.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <BarChart3 size={40} className="text-slate-200 mx-auto mb-4" />
                                        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No records found for this period</p>
                                    </td>
                                </tr>
                            ) : stats.map((row, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-[10px] font-black text-white">
                                                {row.tenantId?.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{row.tenantId?.name}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{row.tenantId?.slug}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2">
                                            {serviceIcons[row.service]}
                                            <span className="text-sm font-bold text-slate-700 capitalize">{row.service}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="text-sm font-medium text-slate-600">
                                            {new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <span className="bg-slate-100 text-slate-900 px-4 py-1 rounded-full text-sm font-black tabular-nums">
                                            {row.count.toLocaleString()}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {!loading && total > 10 && (
                    <div className="p-8 border-t border-slate-50 flex items-center justify-between bg-slate-50/30">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                            Showing <span className="text-slate-900">{(page - 1) * 10 + 1}</span> to <span className="text-slate-900">{Math.min(page * 10, total)}</span> of <span className="text-slate-900">{total}</span> entries
                        </p>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 bg-white border border-slate-100 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-all shadow-sm"
                            >
                                Previous
                            </button>
                            <button 
                                onClick={() => setPage(p => (p * 10 < total ? p + 1 : p))}
                                disabled={page * 10 >= total}
                                className="px-4 py-2 bg-slate-900 border border-slate-900 rounded-xl text-xs font-black uppercase tracking-widest text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UsageAnalytics;
