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
    const getLocalDatetime = (date: Date) => {
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - offset).toISOString().slice(0, 16);
    };

    const [filters, setFilters] = useState({
        tenantId: '',
        service: '',
        startDate: getLocalDatetime(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
        endDate: getLocalDatetime(new Date())
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

    const handleExportCSV = async () => {
        try {
            const res = await api.get(API_ENDPOINTS.SUPER.USAGE, { params: { ...filters, limit: 1000 } });
            const data = res.data.data.data;
            if (!data.length) return toast.error("No data to export");
            
            const headers = ['Showroom', 'Service', 'Date', 'Requests'];
            const csvRows = [headers.join(',')];
            
            data.forEach((row: UsageStat) => {
                const showroom = row.tenantId?.name?.replace(/,/g, '') || 'Unknown';
                const service = row.service;
                const date = new Date(row.date).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                const requests = row.count;
                csvRows.push([showroom, service, date, requests].join(','));
            });
            
            const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('hidden', '');
            a.setAttribute('href', url);
            a.setAttribute('download', `usage-analytics-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            toast.success("CSV exported successfully!");
        } catch (error) {
            toast.error("Failed to export CSV");
        }
    };

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
        <div className="-m-8 lg:-m-10 p-8 lg:p-10 min-h-screen bg-[#0a0b14] text-slate-300 space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        API Usage Analytics
                        <span className="bg-white/10 border border-white/20 text-white text-[10px] px-3 py-1 rounded-full uppercase tracking-tighter">Live Monitor</span>
                    </h1>
                    <p className="text-slate-400 font-medium mt-1 flex items-center gap-2">
                        Track request volume and AI consumption across all showrooms.
                        <span className="inline-block w-1 h-1 rounded-full bg-slate-600" />
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                            Last Refreshed: {lastUpdated.toLocaleTimeString()}
                        </span>
                    </p>
                </div>
                <button 
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl text-sm font-bold text-white hover:bg-white/10 transition-all shadow-sm"
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
                    <div key={i} className="bg-[#161726] p-6 rounded-[2rem] border border-white/5 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                            <m.icon className="w-24 h-24" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-2xl bg-${m.color}-500/10 text-${m.color}-400 group-hover:rotate-12 transition-transform`}>
                                    <m.icon size={24} />
                                </div>
                                <span className="flex items-center gap-1 text-emerald-400 font-bold text-[10px] uppercase tracking-widest animate-pulse">
                                    ● Live
                                </span>
                            </div>
                            <p className="text-slate-500 text-xs font-black uppercase tracking-widest">{m.label}</p>
                            <h2 className="text-3xl font-black text-white mt-1 tabular-nums">{m.value.toLocaleString()}</h2>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters Bar */}
            <div className="bg-[#11121d] rounded-[2.5rem] p-8 border border-white/5 shadow-2xl shadow-black/50">
                <div className="flex flex-col lg:flex-row lg:items-center gap-8">
                    <div className="flex items-center gap-6 flex-1">
                        <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Showroom</label>
                            <div className="relative">
                                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                <select 
                                    value={filters.tenantId}
                                    onChange={(e) => setFilters({...filters, tenantId: e.target.value})}
                                    className="w-full bg-[#0a0b14] border border-white/10 rounded-2xl pl-10 pr-4 py-3.5 text-sm font-bold text-slate-300 focus:ring-4 focus:ring-indigo-500/20 transition-all cursor-pointer appearance-none"
                                >
                                    <option value="">All Showrooms</option>
                                    {tenants.map(t => (
                                        <option key={t.id || t._id} value={t.id || t._id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 flex-1 min-w-[180px]">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Service</label>
                            <select 
                                value={filters.service}
                                onChange={(e) => setFilters({...filters, service: e.target.value})}
                                className="w-full bg-[#0a0b14] border border-white/10 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-300 focus:ring-4 focus:ring-indigo-500/20 transition-all cursor-pointer appearance-none"
                            >
                                <option value="">All Services</option>
                                <option value="bot">WhatsApp Bot</option>
                                <option value="gemini">Gemini AI</option>
                                <option value="kiosk">Kiosk Hub</option>
                                <option value="inventory">Inventory Sync</option>
                                <option value="campaign">Campaigns</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-center lg:text-left">Date & Time Range</label>
                        <div className="flex items-center gap-1 bg-[#0a0b14] border border-white/10 rounded-2xl p-1 shadow-inner">
                            <div className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 rounded-xl transition-all group">
                                <Calendar size={16} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                                <div className="flex flex-col">
                                    <input 
                                        type="datetime-local"
                                        value={filters.startDate}
                                        onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                                        className="bg-transparent border-none text-xs font-black focus:ring-0 cursor-pointer p-0 text-white w-32"
                                        style={{ colorScheme: 'dark' }}
                                    />
                                </div>
                            </div>
                            <div className="w-px h-6 bg-white/10"></div>
                            <div className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 rounded-xl transition-all group">
                                <div className="flex flex-col">
                                    <input 
                                        type="datetime-local"
                                        value={filters.endDate}
                                        onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                                        className="bg-transparent border-none text-xs font-black focus:ring-0 cursor-pointer p-0 text-white w-32"
                                        style={{ colorScheme: 'dark' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#161726] rounded-[2.5rem] border border-white/5 shadow-xl overflow-hidden">
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-xl font-black text-white">Request Logs</h3>
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="Search logs..."
                            className="pl-10 pr-4 py-2 bg-[#0a0b14] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5">
                            <tr>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Showroom</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Service</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Requests</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
                                        <p className="text-slate-500 font-bold mt-4">Crunching usage data...</p>
                                    </td>
                                </tr>
                            ) : stats.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <BarChart3 size={40} className="text-slate-700 mx-auto mb-4" />
                                        <p className="text-slate-500 font-black uppercase tracking-widest text-xs">No records found for this period</p>
                                    </td>
                                </tr>
                            ) : stats.map((row, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center text-[10px] font-black text-indigo-400">
                                                {row.tenantId?.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{row.tenantId?.name}</p>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{row.tenantId?.slug}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2">
                                            {serviceIcons[row.service]}
                                            <span className="text-sm font-bold text-slate-300 capitalize">{row.service}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="text-sm font-medium text-slate-400">
                                            {new Date(row.date).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <span className="bg-indigo-500/10 text-indigo-400 px-4 py-1 rounded-full text-sm font-black tabular-nums border border-indigo-500/20">
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
                    <div className="p-8 border-t border-white/5 flex items-center justify-between bg-white/5">
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
                            Showing <span className="text-white">{(page - 1) * 10 + 1}</span> to <span className="text-white">{Math.min(page * 10, total)}</span> of <span className="text-white">{total}</span> entries
                        </p>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 bg-[#0a0b14] border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 transition-all"
                            >
                                Previous
                            </button>
                            <button 
                                onClick={() => setPage(p => (p * 10 < total ? p + 1 : p))}
                                disabled={page * 10 >= total}
                                className="px-4 py-2 bg-indigo-600 border border-indigo-500 rounded-xl text-xs font-black uppercase tracking-widest text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
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
